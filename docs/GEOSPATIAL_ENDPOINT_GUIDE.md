# Endpoint Geoespacial - Guía Técnica

## 📍 Endpoint: `/api/properties/nearby`

Busca propiedades por proximidad geográfica usando PostGIS y devuelve resultados en formato GeoJSON con paginación cursor.

## 🔧 Implementación Paso a Paso

### 1. Query PostGIS para Proximidad

```sql
SELECT 
  p.id, p.title, p.tipo, p.superficie, p.pais, p.ciudad, p.calle, p.altura, p.ambientes, p.status, p.created_at,
  ST_X(p.location::geometry) as lng,
  ST_Y(p.location::geometry) as lat,
  ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance
FROM propiedades p
WHERE p.tenant_id = $3
  AND p.deleted_at IS NULL
  AND p.location IS NOT NULL
  AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $4)
ORDER BY p.location <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, p.id DESC
LIMIT $5
```

**Explicación de funciones PostGIS:**

- `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`: Crea punto con coordenadas WGS84
- `ST_DWithin(geom1, geom2, distance)`: Filtra por radio en metros
- `ST_Distance(geom1, geom2)`: Calcula distancia exacta en metros
- `<->`: Operador de proximidad para ordenamiento optimizado por índice GiST
- `ST_X()` / `ST_Y()`: Extrae coordenadas longitude/latitude

### 2. Paginación Cursor Geoespacial

**Problema:** Las queries geoespaciales complejas no son compatibles con cursor automático.

**Solución:** Cursor manual basado en `id`:

```typescript
if (cursor) {
  const cursorData = CursorPaginationHelper.decodeCursor(cursor);
  query += ` AND p.id < $${params.length + 1}`;
  params.push(cursorData.id);
}
```

**¿Por qué funciona?**
- El `ORDER BY` principal es por proximidad (`<->`)
- El `ORDER BY` secundario es por `id DESC` (determinístico)
- El cursor usa `id` para mantener posición en resultados ordenados

### 3. Transformación a GeoJSON

```typescript
{
  type: "FeatureCollection",
  features: result.data.map(prop => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [parseFloat(prop.lng), parseFloat(prop.lat)]
    },
    properties: {
      id: prop.id,
      title: prop.title,
      tipo: prop.tipo,
      superficie: parseFloat(prop.superficie),
      pais: prop.pais,
      ciudad: prop.ciudad,
      calle: prop.calle,
      altura: prop.altura,
      ambientes: prop.ambientes,
      status: prop.status,
      distance: parseFloat(prop.distance)
    }
  })),
  pagination: {
    hasNext: result.hasNext,
    nextCursor: result.nextCursor
  }
}
```

## 📋 Uso del Endpoint

### Request
```
GET /api/properties/nearby?lat=-34.6037&lng=-58.3816&radius=1000&limit=20&cursor=eyJ...
```

**Parámetros:**
- `lat`: Latitud (-90 a 90)
- `lng`: Longitud (-180 a 180) 
- `radius`: Radio en metros (0.1 a 50000)
- `limit`: Límite de resultados (1 a 100, default 20)
- `cursor`: Token de paginación (opcional)

### Response
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-58.3816, -34.6037]
      },
      "properties": {
        "id": "uuid",
        "title": "Casa en Palermo",
        "tipo": "casa",
        "superficie": 120.5,
        "pais": "Argentina",
        "ciudad": "Buenos Aires",
        "calle": "Av. Santa Fe",
        "altura": "1234",
        "ambientes": 3,
        "status": "disponible",
        "distance": 250.8
      }
    }
  ],
  "pagination": {
    "hasNext": true,
    "nextCursor": "eyJpZCI6InV1aWQifQ=="
  }
}
```

## 🎯 Optimizaciones PostGIS

### Índices Necesarios
```sql
-- Índice espacial GiST para location
CREATE INDEX idx_propiedades_location_gist ON propiedades USING GIST (location);

-- Índice compuesto para tenant + location
CREATE INDEX idx_propiedades_tenant_location ON propiedades USING GIST (tenant_id, location);
```

### Performance
- **ST_DWithin**: Usa índice espacial para filtro inicial
- **Operador <->**: Usa índice GiST para ordenamiento eficiente
- **Cursor**: Evita OFFSET costoso en datasets grandes

## 🔄 Flujo de Paginación

1. **Primera página**: `GET /nearby?lat=X&lng=Y&radius=Z`
2. **Siguientes páginas**: `GET /nearby?lat=X&lng=Y&radius=Z&cursor=TOKEN`
3. **Fin**: `pagination.hasNext = false`

El cursor mantiene la posición en resultados ordenados por proximidad, garantizando consistencia incluso con inserciones/eliminaciones concurrentes.