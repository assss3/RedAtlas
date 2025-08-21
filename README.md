# Red Atlas Express API

API REST desarrollada con TypeScript, Express, TypeORM y PostgreSQL con PostGIS para gestión de propiedades inmobiliarias.

## 🏗️ Arquitectura

```
src/
├── app.ts                 # Configuración Express
├── server.ts             # Servidor principal
├── config/               # Configuraciones
│   ├── database.ts       # Conexión TypeORM
│   ├── env.ts           # Variables de entorno
│   └── middlewares.ts   # Middlewares comunes
├── core/                # Interfaces y errores
│   ├── interfaces.ts    # Tipos centrales
│   └── errors.ts        # Errores personalizados
├── modules/             # Módulos por entidad
│   ├── usuario/
│   ├── propiedad/
│   ├── anuncio/
│   └── transaccion/
└── shared/db/           # Repositorio base
    └── base.repository.ts
```

## 🚀 Instalación

### 1. Configurar PostgreSQL
```bash
# Configurar PostgreSQL con PostGIS
chmod +x setup-db.sh
./setup-db.sh
```

### 2. Configurar Aplicación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
npm run migration:run

# Crear índices optimizados
psql -h localhost -U red_atlas_user -d red_atlas_db -f sql/indexes.sql

# Generar dataset (100k propiedades, 200k anuncios, 150k transacciones)
npm run seed:production
```

### 3. Ejecutar
```bash
# Desarrollo
npm run dev

# Producción
npm run build && npm start
```

## 📊 Dataset de Producción

### Variables de Entorno
```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=red_atlas_db
SEED_BATCH_SIZE=5000  # Tamaño de lote para inserción
```

### Ejecución del Seed
```bash
# Dataset completo (idempotente)
npm run seed:production

# Verificar datos generados
psql -d red_atlas_db -c "SELECT 
  (SELECT COUNT(*) FROM propiedades) as propiedades,
  (SELECT COUNT(*) FROM anuncios) as anuncios, 
  (SELECT COUNT(*) FROM transacciones) as transacciones;"
```

## 🗄️ Base de Datos

### Prerequisitos
```bash
# PostgreSQL 14+ con PostGIS
sudo apt install postgresql-14 postgresql-14-postgis-3

# Crear base de datos
sudo -u postgres createdb red_atlas_db
sudo -u postgres psql red_atlas_db -c "CREATE EXTENSION postgis;"
sudo -u postgres psql red_atlas_db -c "CREATE EXTENSION pg_trgm;"
```

### Datos Generados
- **100,000 propiedades** distribuidas en Argentina (T1) y Uruguay (T2)
- **200,000 anuncios** con precios realistas por ciudad y tipo
- **150,000 transacciones** con estados distribuidos (60% pendiente, 30% completada, 10% cancelada)
- **Coordenadas PostGIS** en bounding boxes realistas
- **Fechas** distribuidas en últimos 18 meses
- **UUIDs determinísticos** para reproducibilidad

## 📡 Endpoints

### Usuarios (`/api/users`)
- `POST /` - Crear usuario
- `GET /` - Listar usuarios
- `GET /:id` - Obtener usuario
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario

### Propiedades (`/api/properties`) - Solo ADMIN
- `POST /` - Crear propiedad (requiere: title, tipo, superficie, pais, ciudad, calle, altura, ambientes si es CASA/DEPARTAMENTO, status opcional)
- `GET /` - Listar propiedades
- `GET /:id` - Obtener propiedad
- `PUT /:id` - Actualizar propiedad
- `DELETE /:id` - Soft delete
- `PATCH /:id/restore` - Restaurar

### Anuncios (`/api/listings`) - Solo ADMIN
- `POST /` - Crear anuncio (requiere: propertyId, description, tipo, price, status opcional)
- `GET /` - Listar anuncios
- `GET /:id` - Obtener anuncio
- `GET /property/:propertyId` - Por propiedad
- `PUT /:id` - Actualizar anuncio
- `DELETE /:id` - Soft delete
- `PATCH /:id/restore` - Restaurar

### Transacciones (`/api/transactions`)
- `POST /` - Crear transacción (solo USER, requiere: anuncioId, amount)
- `GET /` - Listar transacciones
- `GET /:id` - Obtener transacción
- `GET /user/:userId` - Por usuario
- `GET /anuncio/:anuncioId` - Por anuncio
- `PUT /:id` - Actualizar transacción
- `DELETE /:id` - Soft delete
- `PATCH /:id/restore` - Restaurar
- `PATCH /:id/cancel` - Cancelar transacción (solo ADMIN)
- `PATCH /:id/complete` - Completar transacción (solo ADMIN)

## 🔐 Autenticación

```
Authorization: Bearer <jwt-token>
```

El token JWT contiene:
- `userId`: ID del usuario
- `tenantId`: ID del inquilino
- `role`: Rol del usuario (ADMIN/USER)

## 🌍 PostGIS

El campo `location` en Propiedad está configurado para PostGIS:
- Tipo: `geography(Point, 4326)`
- SRID: 4326 (WGS84)
- Formato: `POINT(longitude latitude)`

## 🏠 Tipos de Propiedad

- DEPARTAMENTO
- CASA
- TERRENO
- LOCAL
- OFICINA

## 📋 Tipos de Operación

- VENTA
- ALQUILER

## 📊 Estados de Anuncio

- ACTIVO
- INACTIVO
- RESERVADO

## 🏠 Estados de Propiedad

- DISPONIBLE
- NO_DISPONIBLE

## 💰 Estados de Transacción

- PENDIENTE
- COMPLETADA
- CANCELADA

## 📋 Reglas de Negocio - Transacciones

### Creación (Solo USER)
- La transacción inicia con estado PENDIENTE
- Todos los anuncios activos de la propiedad pasan a RESERVADO
- La propiedad pasa a NO_DISPONIBLE

### Cancelación (Solo ADMIN)
- La transacción pasa a CANCELADA
- Todos los anuncios de la propiedad vuelven a ACTIVO
- La propiedad vuelve a DISPONIBLE

### Finalización (Solo ADMIN)
- La transacción pasa a COMPLETADA
- Todos los anuncios de la propiedad pasan a INACTIVO
- La propiedad permanece NO_DISPONIBLE

## 🔮 Mejoras Futuras

- **Integración con APIs de Geolocalización**: Usar servicios como Google Maps API o OpenStreetMap para mantener consistencia en nombres de países, ciudades y calles, y validar direcciones automáticamente.

## 🏷️ Roles

- **ADMIN**: Puede crear/editar Propiedades y Anuncios
- **USER**: Puede crear Transacciones

## 🔧 Multi-tenant

Todas las entidades incluyen `tenant_id` para aislamiento de datos por inquilino.

## 🧪 Testing

### Ejecutar Tests
```bash
# Todos los tests
npm test

# Solo tests unitarios
npm run test:unit

# Tests en modo watch
npm run test:watch

# Reporte de cobertura
npm run test:coverage
```

### Cobertura de Tests
- ✅ **Servicios**: Lógica de negocio, validaciones, operaciones CRUD
- ✅ **Controladores**: Manejo de requests, control de acceso por roles
- ✅ **Utilidades**: Cache, paginación, manejo de errores
- ✅ **Middleware**: Autenticación, validación, formateo de errores

Ver [TESTING_GUIDE.md](TESTING_GUIDE.md) para documentación completa.