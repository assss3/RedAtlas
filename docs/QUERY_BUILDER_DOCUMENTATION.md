# Query Builder Dinámico - Documentación

## Descripción General

Sistema de búsqueda optimizado para multi-tenant que permite filtrar anuncios con criterios combinables de forma dinámica.

## Endpoint

```
GET /api/listings/search
```

## Parámetros de Consulta

### Filtros de Anuncio
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `status` | string | Estado del anuncio | `activo`, `inactivo`, `reservado` |
| `tipo` | string | Tipo de operación | `venta`, `alquiler` |
| `propertyId` | uuid | ID específico de propiedad | `123e4567-e89b-12d3-a456-426614174000` |
| `minPrice` | number | Precio mínimo | `100000` |
| `maxPrice` | number | Precio máximo | `500000` |

### Filtros de Propiedad
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `propertyTipo` | string | Tipo de propiedad | `casa`, `departamento`, `terreno` |
| `propertyStatus` | string | Estado de propiedad | `disponible`, `no_disponible` |
| `pais` | string | País | `Argentina` |
| `ciudad` | string | Ciudad | `Buenos Aires` |
| `minSuperficie` | number | Superficie mínima (m²) | `50` |
| `maxSuperficie` | number | Superficie máxima (m²) | `200` |
| `ambientes` | number | Cantidad de ambientes | `3` |

### Paginación
| Parámetro | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| `page` | number | Número de página | `1` |
| `limit` | number | Elementos por página | `10` |

## Optimizaciones Implementadas

### 1. Multi-Tenant First
```sql
WHERE anuncio.tenantId = :tenantId  -- Siempre primera condición
```

### 2. Índices Utilizados
- `IDX_anuncios_tenant_id` - Filtro base por tenant
- `IDX_anuncios_tenant_status` - Filtro por estado
- `IDX_anuncios_tenant_property` - Filtro por propiedad
- `IDX_propiedades_tenant_tipo` - Filtro por tipo de propiedad
- `IDX_propiedades_tenant_status` - Filtro por estado de propiedad

### 3. JOIN Optimizado
```sql
LEFT JOIN propiedades property ON anuncio.property_id = property.id
```

### 4. Filtros Condicionales
Solo se aplican filtros si están presentes en la query string:
```typescript
if (searchFilters.status) {
  queryBuilder.andWhere('anuncio.status = :status', { status: searchFilters.status });
}
```

## Ejemplos de Uso

### Búsqueda Básica
```bash
curl -X GET "http://localhost:3001/api/listings/search" \
  -H "x-tenant-id: tenant-123"
```

### Filtros Combinados
```bash
curl -X GET "http://localhost:3001/api/listings/search?status=activo&propertyTipo=casa&ciudad=Buenos%20Aires&minPrice=100000&page=1&limit=5" \
  -H "x-tenant-id: tenant-123"
```

## Respuesta

```json
{
  "data": [
    {
      "id": "uuid",
      "description": "Descripción del anuncio",
      "tipo": "venta",
      "price": 250000,
      "status": "activo",
      "property": {
        "id": "uuid",
        "title": "Casa en Palermo",
        "tipo": "casa",
        "superficie": 120.50,
        "ambientes": 3,
        "pais": "Argentina",
        "ciudad": "Buenos Aires"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 5,
  "totalPages": 5
}
```

## Rendimiento

### Query SQL Generada (Ejemplo)
```sql
SELECT anuncio.*, property.*
FROM anuncios anuncio
LEFT JOIN propiedades property ON anuncio.property_id = property.id
WHERE anuncio.tenant_id = 'tenant-123'
  AND anuncio.status = 'activo'
  AND property.tipo = 'casa'
  AND property.ciudad = 'Buenos Aires'
  AND anuncio.price >= 100000
ORDER BY anuncio.created_at DESC
LIMIT 5 OFFSET 0;
```

### Beneficios
- **Escalabilidad**: Rendimiento constante independiente del número de tenants
- **Flexibilidad**: Cualquier combinación de filtros
- **Eficiencia**: Solo ejecuta una consulta SQL
- **Índices**: Aprovecha índices compuestos multi-tenant

## Arquitectura

```
Controller → Service → Repository → QueryBuilder → Database
     ↓         ↓          ↓            ↓           ↓
   Params → Filters → Dynamic SQL → Optimized → Results
```

### Separación de Responsabilidades
- **Controller**: Maneja HTTP y validaciones
- **Service**: Lógica de negocio
- **Repository**: Construcción de queries
- **QueryBuilder**: SQL dinámico optimizado