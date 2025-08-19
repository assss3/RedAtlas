# Paginación por Cursor

## ¿Qué es la paginación por cursor?

La paginación por cursor es una técnica de paginación que utiliza un "cursor" (puntero) para navegar a través de grandes conjuntos de datos de manera eficiente. A diferencia de la paginación tradicional con OFFSET/LIMIT, la paginación por cursor mantiene un rendimiento consistente independientemente del tamaño del conjunto de datos.

## ¿Por qué elegimos cursor sobre OFFSET?

### Problemas con OFFSET/LIMIT:
- **Rendimiento degradado**: Con OFFSET alto, la base de datos debe contar y saltar muchos registros
- **Inconsistencias**: Si se insertan/eliminan registros durante la navegación, pueden aparecer duplicados o perderse elementos
- **Escalabilidad**: El rendimiento empeora linealmente con el tamaño del dataset

### Ventajas de cursor:
- **Rendimiento consistente**: O(log n) independientemente de la posición en el dataset
- **Estabilidad**: Los resultados son consistentes aunque cambien los datos
- **Escalabilidad**: Funciona eficientemente con millones de registros

## Implementación técnica

### Cursor utilizado
Utilizamos un cursor compuesto por:
```typescript
{
  createdAt: Date,  // Fecha de creación
  id: string        // ID único como desempate
}
```

### Ordenamiento
Los resultados se ordenan por:
1. `createdAt DESC` (más recientes primero)
2. `id DESC` (desempate para registros con la misma fecha)

## Ejemplos de uso

### 1. Request inicial (primera página)

```http
GET /api/listings/search?limit=10&status=activo
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "description": "Departamento céntrico",
      "createdAt": "2024-01-15T10:30:00.000Z",
      ...
    },
    ...
  ],
  "nextCursor": {
    "createdAt": "2024-01-14T15:20:00.000Z",
    "id": "uuid-10"
  },
  "hasMore": true
}
```

### 2. Request con cursor (siguiente página)

```http
POST /api/listings/search
Content-Type: application/json

{
  "limit": 10,
  "status": "activo",
  "cursor": "eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE0VDE1OjIwOjAwLjAwMFoiLCJpZCI6InV1aWQtMTAifQ=="
}
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid-11",
      "description": "Casa en zona norte",
      "createdAt": "2024-01-14T14:10:00.000Z",
      ...
    },
    ...
  ],
  "nextCursor": {
    "createdAt": "2024-01-13T09:45:00.000Z",
    "id": "uuid-20"
  },
  "hasMore": true
}
```

### 3. Última página

```json
{
  "data": [
    {
      "id": "uuid-95",
      "description": "Último anuncio",
      "createdAt": "2024-01-01T08:00:00.000Z",
      ...
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

## Endpoints disponibles

### Anuncios
```http
GET /api/listings/search?cursor=<cursor>&limit=20&status=activo
```

### Propiedades
```http
GET /api/properties/search?cursor=<cursor>&limit=20&tipo=departamento
```

### Transacciones
```http
GET /api/transactions/search?cursor=<cursor>&limit=20&status=pendiente
```

## Filtros soportados

### Anuncios
- `status`: Estado del anuncio (activo, inactivo, reservado)
- `tipo`: Tipo de operación (venta, alquiler)
- `propertyId`: ID de la propiedad
- `minPrice`, `maxPrice`: Rango de precios
- `propertyTipo`: Tipo de propiedad (departamento, casa, etc.)
- `ciudad`, `pais`: Ubicación
- `ambientes`: Número de ambientes

### Propiedades
- `status`: Estado (disponible, no_disponible)
- `tipo`: Tipo (departamento, casa, terreno, local, oficina)
- `pais`, `ciudad`: Ubicación
- `minSuperficie`, `maxSuperficie`: Rango de superficie
- `ambientes`: Número de ambientes

### Transacciones
- `status`: Estado (pendiente, completada, cancelada)
- `userId`: ID del usuario
- `anuncioId`: ID del anuncio
- `minAmount`, `maxAmount`: Rango de montos

## Validaciones y límites

- **Límite máximo**: 100 registros por request
- **Límite por defecto**: 20 registros
- **Cursor inválido**: Retorna error 400 con mensaje descriptivo
- **Límite inválido**: Se ajusta automáticamente al rango válido (1-100)

## Cómo reutilizar el helper en nuevas entidades

### 1. Importar el helper

```typescript
import { CursorPaginationHelper, CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';
```

### 2. Implementar en el repositorio

```typescript
async searchWithFilters(filters: {
  tenantId: string;
  cursor?: string;
  limit?: number;
  // ... otros filtros específicos
}): Promise<CursorPaginationResult<MiEntidad>> {
  const { tenantId, cursor, limit: requestLimit, ...searchFilters } = filters;
  const limit = CursorPaginationHelper.validateLimit(requestLimit);

  const queryBuilder = this.repository
    .createQueryBuilder('alias')
    .where('alias.tenantId = :tenantId', { tenantId });

  // Aplicar cursor si existe
  if (cursor) {
    const cursorData = CursorPaginationHelper.decodeCursor(cursor);
    CursorPaginationHelper.applyCursorCondition(queryBuilder, cursorData, 'alias');
  }

  // Aplicar filtros específicos...

  // Ordenamiento obligatorio
  queryBuilder
    .orderBy('alias.createdAt', 'DESC')
    .addOrderBy('alias.id', 'DESC')
    .limit(limit + 1);

  const data = await queryBuilder.getMany();
  return CursorPaginationHelper.buildResult(data, limit);
}
```

### 3. Requisitos de la entidad

La entidad debe tener:
- Campo `createdAt: Date`
- Campo `id: string`
- Índice compuesto en `(tenant_id, created_at, id)` para rendimiento óptimo

## Consideraciones de rendimiento

### Índices recomendados
```sql
-- Para anuncios
CREATE INDEX idx_anuncios_cursor ON anuncios (tenant_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;

-- Para propiedades  
CREATE INDEX idx_propiedades_cursor ON propiedades (tenant_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;

-- Para transacciones
CREATE INDEX idx_transacciones_cursor ON transacciones (tenant_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
```

### Mejores prácticas
- Usar siempre `limit + 1` para detectar si hay más resultados
- Mantener el ordenamiento consistente: `createdAt DESC, id DESC`
- Validar y sanitizar el cursor antes de usarlo
- Implementar manejo de errores para cursors inválidos