# Guía de Escalabilidad para 1M+ Registros

## 📊 Configuración Actual vs Objetivo

### Dataset Actual
- **100,000 propiedades** (50k por tenant)
- **200,000 anuncios** (100k por tenant)  
- **150,000 transacciones** (75k por tenant)
- **2 tenants fijos** con datos geográficos realistas

### Objetivo de Escalabilidad
- **1M+ propiedades**
- **2M+ anuncios**
- **1.5M+ transacciones**
- **Múltiples tenants**

## 🚀 Estrategia de Particionamiento

### Fase 1: Particionamiento por Tenant (Hash)

```sql
-- Crear tabla particionada por tenant_id
CREATE TABLE propiedades_partitioned (
    LIKE propiedades INCLUDING ALL
) PARTITION BY HASH (tenant_id);

-- Crear particiones (4 particiones para distribución uniforme)
CREATE TABLE propiedades_p0 PARTITION OF propiedades_partitioned
    FOR VALUES WITH (modulus 4, remainder 0);
CREATE TABLE propiedades_p1 PARTITION OF propiedades_partitioned
    FOR VALUES WITH (modulus 4, remainder 1);
CREATE TABLE propiedades_p2 PARTITION OF propiedades_partitioned
    FOR VALUES WITH (modulus 4, remainder 2);
CREATE TABLE propiedades_p3 PARTITION OF propiedades_partitioned
    FOR VALUES WITH (modulus 4, remainder 3);
```

### Fase 2: Particionamiento Híbrido (Tenant + Fecha)

```sql
-- Para tablas con alta inserción temporal
CREATE TABLE transacciones_partitioned (
    LIKE transacciones INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Particiones mensuales
CREATE TABLE transacciones_2024_01 PARTITION OF transacciones_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE transacciones_2024_02 PARTITION OF transacciones_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... continuar por cada mes

-- Sub-particionamiento por tenant dentro de cada mes
ALTER TABLE transacciones_2024_01 PARTITION BY HASH (tenant_id);
CREATE TABLE transacciones_2024_01_p0 PARTITION OF transacciones_2024_01
    FOR VALUES WITH (modulus 2, remainder 0);
CREATE TABLE transacciones_2024_01_p1 PARTITION OF transacciones_2024_01
    FOR VALUES WITH (modulus 2, remainder 1);
```

## 🔧 Configuración PostgreSQL Optimizada

### postgresql.conf
```ini
# Memoria (para servidor con 32GB RAM)
shared_buffers = 8GB
effective_cache_size = 24GB
work_mem = 512MB
maintenance_work_mem = 2GB

# Conexiones
max_connections = 300
max_prepared_transactions = 300

# WAL y Checkpoints
wal_buffers = 256MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 4GB
min_wal_size = 1GB

# Paralelismo
max_worker_processes = 16
max_parallel_workers = 12
max_parallel_workers_per_gather = 4

# PostGIS específico
max_locks_per_transaction = 512
shared_preload_libraries = 'pg_stat_statements,auto_explain'

# Autovacuum tuning
autovacuum_max_workers = 6
autovacuum_naptime = 30s
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05
```

## 📈 Índices para Particiones

### Script de Creación de Índices por Partición
```sql
-- Función para crear índices en todas las particiones
CREATE OR REPLACE FUNCTION create_partition_indexes(table_name text)
RETURNS void AS $$
DECLARE
    partition_name text;
BEGIN
    FOR partition_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE tablename LIKE table_name || '_p%'
    LOOP
        -- Índices locales por partición
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I_tenant_status_idx 
                       ON %s (tenant_id, status) WHERE deleted_at IS NULL', 
                       partition_name, partition_name);
        
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I_created_idx 
                       ON %s (created_at DESC)', 
                       partition_name, partition_name);
                       
        -- Índice espacial para propiedades
        IF table_name = 'propiedades' THEN
            EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I_location_gist_idx 
                           ON %s USING GIST (location)', 
                           partition_name, partition_name);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar para cada tabla particionada
SELECT create_partition_indexes('propiedades');
SELECT create_partition_indexes('anuncios');
SELECT create_partition_indexes('transacciones');
```

## 🔄 Playbook de Migración

### 1. Preparación
```bash
# Backup completo
pg_dump -Fc -Z9 red_atlas_db > backup_pre_partition_$(date +%Y%m%d).dump

# Análisis de queries actuales
psql -c "SELECT query, calls, mean_time, total_time 
         FROM pg_stat_statements 
         ORDER BY total_time DESC LIMIT 20;"
```

### 2. Migración Gradual (Zero Downtime)
```sql
-- 1. Crear tablas particionadas
CREATE TABLE propiedades_new (LIKE propiedades INCLUDING ALL) 
PARTITION BY HASH (tenant_id);

-- 2. Crear particiones
-- (usar script anterior)

-- 3. Migrar datos por lotes
DO $$
DECLARE
    batch_size INTEGER := 10000;
    offset_val INTEGER := 0;
    row_count INTEGER;
BEGIN
    LOOP
        INSERT INTO propiedades_new 
        SELECT * FROM propiedades 
        ORDER BY id 
        LIMIT batch_size OFFSET offset_val;
        
        GET DIAGNOSTICS row_count = ROW_COUNT;
        EXIT WHEN row_count = 0;
        
        offset_val := offset_val + batch_size;
        RAISE NOTICE 'Migrated % rows', offset_val;
        
        -- Pausa para no saturar el sistema
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

-- 4. Verificar integridad
SELECT 
    (SELECT COUNT(*) FROM propiedades) as original,
    (SELECT COUNT(*) FROM propiedades_new) as migrated;

-- 5. Intercambiar tablas (requiere mantenimiento breve)
BEGIN;
ALTER TABLE propiedades RENAME TO propiedades_old;
ALTER TABLE propiedades_new RENAME TO propiedades;
COMMIT;
```

### 3. Validación Post-Migración
```sql
-- Verificar planes de ejecución
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM propiedades 
WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440010' 
  AND ciudad = 'Buenos Aires' 
  AND tipo = 'departamento';

-- Debe mostrar "Partition Pruning" y acceso solo a partición relevante
```

## 📊 Monitoreo y Métricas

### Queries de Monitoreo
```sql
-- Tamaño por partición
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'propiedades_p%' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Distribución de datos por partición
SELECT 
    tableoid::regclass as partition_name,
    COUNT(*) as row_count,
    MIN(created_at) as min_date,
    MAX(created_at) as max_date
FROM propiedades 
GROUP BY tableoid 
ORDER BY row_count DESC;

-- Exclusión de particiones (partition pruning)
SELECT 
    query,
    calls,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%propiedades%' 
ORDER BY calls DESC;
```

### Alertas Recomendadas
```sql
-- Particiones que crecen demasiado rápido
SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE '%_p%' 
  AND pg_total_relation_size(schemaname||'.'||tablename) > 10 * 1024^3; -- >10GB

-- Queries que no usan partition pruning
SELECT query, calls, mean_time
FROM pg_stat_statements 
WHERE query LIKE '%Seq Scan%' 
  AND (query LIKE '%propiedades%' OR query LIKE '%anuncios%' OR query LIKE '%transacciones%')
ORDER BY calls DESC;
```

## 🎯 Hardware Recomendado

### Para 1M registros
- **CPU**: 8 cores (Intel Xeon o AMD EPYC)
- **RAM**: 32GB
- **Storage**: NVMe SSD 1TB (IOPS > 10,000)
- **Network**: 1Gbps

### Para 10M+ registros
- **CPU**: 16+ cores
- **RAM**: 64GB+
- **Storage**: NVMe SSD RAID 10, 2TB+
- **Network**: 10Gbps
- **Consideraciones**: Cluster PostgreSQL con réplicas de lectura

## 🔍 Queries de Ejemplo Optimizadas

### Búsqueda Multi-Filtro
```sql
-- Query optimizada que usa múltiples índices
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, a.price, a.tipo as operacion
FROM propiedades p
JOIN anuncios a ON p.id = a.property_id
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'  -- Partition pruning
  AND p.ciudad = 'Buenos Aires'                              -- idx_propiedades_tenant_ciudad_tipo
  AND p.tipo = 'departamento'                                -- idx_propiedades_tenant_ciudad_tipo
  AND p.status = 'disponible'                                -- idx_propiedades_tenant_status
  AND a.status = 'activo'                                    -- idx_anuncios_tenant_status
  AND a.price BETWEEN 100000 AND 300000                     -- idx_anuncios_tenant_price
ORDER BY a.created_at DESC                                   -- idx_anuncios_tenant_created
LIMIT 20;

-- Plan esperado:
-- -> Limit
--   -> Nested Loop
--     -> Index Scan using idx_anuncios_tenant_price
--     -> Index Scan using idx_propiedades_tenant_ciudad_tipo
```

### Búsqueda Geográfica
```sql
-- Búsqueda por proximidad usando PostGIS
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, ST_Distance(p.location, ST_Point(-58.3816, -34.6037)) as distancia
FROM propiedades p
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND ST_DWithin(p.location, ST_Point(-58.3816, -34.6037), 1000)  -- 1km radio
  AND p.status = 'disponible'
ORDER BY p.location <-> ST_Point(-58.3816, -34.6037)  -- Operador de distancia KNN
LIMIT 10;

-- Plan esperado:
-- -> Limit
--   -> Index Scan using idx_propiedades_location_gist (KNN)
--     -> Filter: tenant_id = '...' AND status = 'disponible'
```

## 🚨 Consideraciones Críticas

1. **Partition Pruning**: Siempre filtrar por columna de particionamiento
2. **Constraint Exclusion**: Habilitar para mejor rendimiento
3. **Maintenance**: Automatizar creación de particiones futuras
4. **Backup**: Estrategia por partición para backups incrementales
5. **Monitoring**: pg_stat_user_tables para estadísticas por partición

## 📋 Checklist de Implementación

- [ ] Configurar postgresql.conf según especificaciones
- [ ] Crear tablas particionadas
- [ ] Migrar datos gradualmente
- [ ] Crear índices por partición
- [ ] Configurar autovacuum por partición
- [ ] Implementar monitoreo de particiones
- [ ] Automatizar creación de particiones futuras
- [ ] Documentar procedimientos de mantenimiento
- [ ] Entrenar equipo en troubleshooting de particiones