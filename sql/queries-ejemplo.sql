-- Queries de ejemplo optimizadas para demostrar uso de índices

-- 1. Búsqueda multi-filtro por tenant, ciudad y tipo
-- Usa: idx_propiedades_tenant_ciudad_tipo
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, a.price, a.tipo as operacion
FROM propiedades p
JOIN anuncios a ON p.id = a.property_id
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND p.ciudad = 'Buenos Aires'
  AND p.tipo = 'departamento'
  AND p.status = 'disponible'
  AND a.status = 'activo'
  AND a.price BETWEEN 100000 AND 300000
ORDER BY a.created_at DESC
LIMIT 20;

-- 2. Búsqueda geográfica con PostGIS
-- Usa: idx_propiedades_location_gist
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    p.*,
    ST_Distance(p.location, ST_Point(-58.3816, -34.6037)) as distancia_metros
FROM propiedades p
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND ST_DWithin(p.location, ST_Point(-58.3816, -34.6037), 1000)
  AND p.status = 'disponible'
ORDER BY p.location <-> ST_Point(-58.3816, -34.6037)
LIMIT 10;

-- 3. Búsqueda de texto completo
-- Usa: idx_propiedades_title_gin
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.*, ts_rank(to_tsvector('spanish', p.title), query) as rank
FROM propiedades p, to_tsquery('spanish', 'departamento & palermo') query
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND to_tsvector('spanish', p.title) @@ query
  AND p.deleted_at IS NULL
ORDER BY rank DESC
LIMIT 20;

-- 4. Reporte de transacciones por período
-- Usa: idx_transacciones_tenant_status_created
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    DATE_TRUNC('month', t.created_at) as mes,
    t.status,
    COUNT(*) as cantidad,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as promedio_amount
FROM transacciones t
WHERE t.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND t.created_at >= '2024-01-01'
  AND t.created_at < '2025-01-01'
  AND t.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', t.created_at), t.status
ORDER BY mes DESC, t.status;

-- 5. Top propiedades por precio en área específica
-- Usa: idx_anuncios_tenant_price + idx_propiedades_location_gist
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    p.title,
    p.ciudad,
    p.tipo,
    a.price,
    a.tipo as operacion,
    ST_AsText(p.location) as coordenadas
FROM propiedades p
JOIN anuncios a ON p.id = a.property_id
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND p.ciudad = 'Buenos Aires'
  AND a.status = 'activo'
  AND a.tipo = 'venta'
  AND p.deleted_at IS NULL
  AND a.deleted_at IS NULL
ORDER BY a.price DESC
LIMIT 50;

-- 6. Análisis de performance por índice
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "Veces usado",
    idx_tup_read as "Tuplas leídas",
    idx_tup_fetch as "Tuplas obtenidas"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 7. Verificar partition pruning (cuando se implemente)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*)
FROM propiedades 
WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND created_at >= '2024-01-01';

-- 8. Query compleja con múltiples JOINs
-- Demuestra uso de múltiples índices tenant-first
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    p.title,
    p.ciudad,
    a.price,
    a.tipo as operacion,
    t.status as estado_transaccion,
    u.nombre as usuario,
    t.created_at as fecha_transaccion
FROM propiedades p
JOIN anuncios a ON p.id = a.property_id
JOIN transacciones t ON a.id = t.anuncio_id
JOIN usuarios u ON t.user_id = u.id
WHERE p.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND a.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND t.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND u.tenant_id = '550e8400-e29b-41d4-a716-446655440010'
  AND t.status = 'completada'
  AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY t.created_at DESC
LIMIT 100;