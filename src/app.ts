import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { errorHandler } from './config/error.middleware';
import { authenticateToken } from './config/auth.middleware';
import { usuarioRoutes } from './modules/usuario/usuario.routes';
import { propiedadRoutes } from './modules/propiedad/propiedad.routes';
import { anuncioRoutes } from './modules/anuncio/anuncio.routes';
import { transaccionRoutes } from './modules/transaccion/transaccion.routes';
import { authRoutes } from './modules/auth/auth.routes';

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI (sin autenticación)
try {
  const swaggerPath = path.join(__dirname, '../docs/swagger.yaml');
  const swaggerDocument = yaml.load(fs.readFileSync(swaggerPath, 'utf8')) as object;
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Red Atlas Express API Documentation'
  }));
} catch (error) {
  console.warn('⚠️ Could not load Swagger documentation:', error);
}

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use(authenticateToken);

// Rutas protegidas
app.use('/api/users', usuarioRoutes);
app.use('/api/properties', propiedadRoutes);
app.use('/api/listings', anuncioRoutes);
app.use('/api/transactions', transaccionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    type: '/errors/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Route ${req.originalUrl} not found`,
    instance: req.originalUrl
  });
});

export { app };