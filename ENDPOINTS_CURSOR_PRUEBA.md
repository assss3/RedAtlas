# Endpoints para Probar Paginación por Cursor

## Configuración Previa
```bash
# Headers requeridos para todas las peticiones
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## 10 Endpoints de Prueba

### 1. Búsqueda de Anuncios - Primera página
```http
GET /api/listings/search?limit=5&status=activo
```
**Descripción**: Obtiene los primeros 5 anuncios activos. Copiar `nextCursor` para siguiente página.

### 2. Búsqueda de Anuncios - Con cursor
```http
GET /api/listings/search?limit=5&status=activo&cursor=eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE0VDE1OjIwOjAwLjAwMFoiLCJpZCI6InV1aWQtMTAifQ==
```
**Descripción**: Usa el cursor de la respuesta anterior para obtener la siguiente página.

### 3. Búsqueda de Anuncios - Por tipo
```http
GET /api/listings/search?limit=8&tipo=venta
```
**Descripción**: Busca anuncios de venta con paginación por cursor.

### 4. Búsqueda de Anuncios - Filtros múltiples
```http
GET /api/listings/search?limit=6&status=activo&propertyTipo=departamento&ciudad=Buenos Aires
```
**Descripción**: Búsqueda avanzada con múltiples filtros usando cursor.

### 5. Búsqueda de Anuncios - Por rango de precios
```http
GET /api/listings/search?limit=7&minPrice=100000&maxPrice=500000
```
**Descripción**: Busca anuncios en un rango de precios específico.

### 6. Búsqueda de Propiedades - Primera página
```http
GET /api/properties/search?limit=10&status=disponible
```
**Descripción**: Lista propiedades disponibles con cursor pagination.

### 7. Búsqueda de Propiedades - Por tipo
```http
GET /api/properties/search?limit=8&tipo=casa&ciudad=Montevideo
```
**Descripción**: Busca casas en Montevideo usando cursor.

### 8. Búsqueda de Transacciones - Por estado
```http
GET /api/transactions/search?limit=12&status=pendiente
```
**Descripción**: Lista transacciones pendientes con paginación por cursor.

### 9. Búsqueda de Transacciones - Por usuario
```http
GET /api/transactions/search?limit=5&userId=<user-id-from-seed>
```
**Descripción**: Busca transacciones de un usuario específico.

### 10. Búsqueda de Transacciones - Por rango de montos
```http
GET /api/transactions/search?limit=6&minAmount=50000&maxAmount=200000
```
**Descripción**: Busca transacciones en un rango de montos específico.

## Flujo de Prueba Recomendado

### Paso 1: Primera página
```http
GET /api/listings/search?limit=3&status=activo
```

### Paso 2: Copiar nextCursor de la respuesta
```json
{
  "data": [...],
  "nextCursor": {
    "createdAt": "2024-01-14T15:20:00.000Z",
    "id": "uuid-example"
  },
  "hasMore": true
}
```

### Paso 3: Codificar cursor manualmente o usar el valor
```javascript
// El cursor se codifica automáticamente en base64
const cursor = btoa(JSON.stringify({
  createdAt: "2024-01-14T15:20:00.000Z",
  id: "uuid-example"
}));
```

### Paso 4: Segunda página
```http
GET /api/listings/search?limit=3&status=activo&cursor=<cursor-codificado>
```

### Paso 5: Continuar hasta hasMore = false

## Ejemplo de Respuesta Completa

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "description": "Hermoso departamento en Palermo",
      "tipo": "venta",
      "price": 250000,
      "status": "activo",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "property": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "title": "Departamento 2 ambientes",
        "tipo": "departamento",
        "superficie": 65.5,
        "ciudad": "Buenos Aires",
        "ambientes": 2
      }
    }
  ],
  "nextCursor": {
    "createdAt": "2024-01-14T15:20:00.000Z",
    "id": "550e8400-e29b-41d4-a716-446655440001"
  },
  "hasMore": true
}
```

## Validaciones a Probar

### Cursor inválido
```http
GET /api/listings/search?cursor=invalid-cursor
```
**Respuesta esperada**: Error 400 con mensaje "Cursor inválido"

### Límite excesivo
```http
GET /api/listings/search?limit=200
```
**Comportamiento**: Se ajusta automáticamente a 100 (límite máximo)

### Sin resultados
```http
GET /api/listings/search?status=inexistente
```
**Respuesta esperada**: 
```json
{
  "data": [],
  "nextCursor": null,
  "hasMore": false
}
```

## Comparación de Rendimiento

Para comparar el rendimiento entre cursor y offset tradicional:

### Con cursor (eficiente)
```http
GET /api/listings/search?cursor=<cursor>&limit=20
```

### Con offset tradicional (menos eficiente en páginas altas)
```http
GET /api/listings?page=1000&limit=20
```

**Nota**: El endpoint con offset ya no está disponible, todas las búsquedas usan cursor pagination.