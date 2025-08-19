import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity';
import { Propiedad } from '../modules/propiedad/propiedad.entity';
import { Anuncio } from '../modules/anuncio/anuncio.entity';
import { Transaccion } from '../modules/transaccion/transaccion.entity';
import { Tenant } from '../modules/tenant/tenant.entity';
import { RefreshToken } from '../modules/auth/refresh-token.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'red_atlas_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Usuario, Propiedad, Anuncio, Transaccion, Tenant, RefreshToken],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});