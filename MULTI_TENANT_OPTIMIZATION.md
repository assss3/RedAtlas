# Optimizaciones Multi-Tenant

## Índices Creados

### Índices Individuales
- `IDX_usuarios_tenant_id` - Optimiza búsquedas por tenant en usuarios
- `IDX_propiedades_tenant_id` - Optimiza búsquedas por tenant en propiedades  
- `IDX_anuncios_tenant_id` - Optimiza búsquedas por tenant en anuncios
- `IDX_transacciones_tenant_id` - Optimiza búsquedas por tenant en transacciones
- `IDX_refresh_tokens_tenant_id` - Optimiza búsquedas por tenant en tokens

### Índices Compuestos
- `IDX_usuarios_tenant_email` - Login optimizado (tenant_id, email)
- `IDX_propiedades_tenant_status` - Filtro por disponibilidad (tenant_id, status)
- `IDX_propiedades_tenant_tipo` - Filtro por tipo (tenant_id, tipo)
- `IDX_anuncios_tenant_property` - Consulta muy frecuente (tenant_id, property_id)
- `IDX_anuncios_tenant_status` - Filtro por estado (tenant_id, status)
- `IDX_transacciones_tenant_user` - Consulta por usuario (tenant_id, user_id)
- `IDX_transacciones_tenant_anuncio` - Consulta por anuncio (tenant_id, anuncio_id)

## Cambios en Repositorios

### Principio: tenant_id SIEMPRE PRIMERO
Todas las consultas WHERE ahora ponen `tenant_id` como primera condición para aprovechar los índices.

### Nuevos Métodos Agregados

**UsuarioRepository:**
- `findByRole(role, tenantId)` - Buscar por rol

**PropiedadRepository:**
- `findByStatus(status, tenantId)` - Buscar por estado
- `findByTipo(tipo, tenantId)` - Buscar por tipo
- `findByLocation(pais, ciudad, tenantId)` - Buscar por ubicación

**AnuncioRepository:**
- `findByStatus(status, tenantId)` - Buscar por estado
- `findByTipo(tipo, tenantId)` - Buscar por tipo

**TransaccionRepository:**
- `findByStatus(status, tenantId)` - Buscar por estado
- `findPendingByAnuncioId(anuncioId, tenantId)` - Buscar pendientes por anuncio

## Beneficios de Rendimiento

1. **Consultas más rápidas**: Los índices compuestos eliminan la necesidad de escanear toda la tabla
2. **Aislamiento eficiente**: tenant_id como primera condición aprovecha al máximo los índices
3. **Escalabilidad**: El rendimiento se mantiene constante independientemente del número de tenants
4. **Memoria optimizada**: PostgreSQL puede usar índices más pequeños y eficientes

## Uso Recomendado

Siempre usar los métodos del repositorio que incluyen `tenantId` como parámetro. Evitar consultas directas que no consideren el tenant.