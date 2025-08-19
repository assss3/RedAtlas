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

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Compilar TypeScript
npm run build

# Desarrollo
npm run dev

# Producción
npm start
```

## 🗄️ Base de Datos

Asegúrate de tener PostgreSQL con PostGIS instalado:

```sql
CREATE DATABASE red_atlas_db;
CREATE EXTENSION postgis;
```

## 📡 Endpoints

### Usuarios (`/api/users`)
- `POST /` - Crear usuario
- `GET /` - Listar usuarios
- `GET /:id` - Obtener usuario
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario

### Propiedades (`/api/properties`) - Solo ADMIN
- `POST /` - Crear propiedad
- `GET /` - Listar propiedades
- `GET /:id` - Obtener propiedad
- `PUT /:id` - Actualizar propiedad
- `DELETE /:id` - Soft delete
- `PATCH /:id/restore` - Restaurar

### Anuncios (`/api/listings`) - Solo ADMIN
- `POST /` - Crear anuncio
- `GET /` - Listar anuncios
- `GET /:id` - Obtener anuncio
- `GET /property/:propertyId` - Por propiedad
- `PUT /:id` - Actualizar anuncio
- `DELETE /:id` - Soft delete
- `PATCH /:id/restore` - Restaurar

### Transacciones (`/api/transactions`) - Solo USER
- `POST /` - Crear transacción
- `GET /` - Listar transacciones
- `GET /:id` - Obtener transacción
- `GET /user/:userId` - Por usuario
- `GET /anuncio/:anuncioId` - Por anuncio
- `PUT /:id` - Actualizar transacción
- `DELETE /:id` - Soft delete
- `PATCH /:id/restore` - Restaurar

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

## 🏷️ Roles

- **ADMIN**: Puede crear/editar Propiedades y Anuncios
- **USER**: Puede crear Transacciones

## 🔧 Multi-tenant

Todas las entidades incluyen `tenant_id` para aislamiento de datos por inquilino.