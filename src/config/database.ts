import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity';
import { Propiedad } from '../modules/propiedad/propiedad.entity';
import { Anuncio } from '../modules/anuncio/anuncio.entity';
import { Transaccion } from '../modules/transaccion/transaccion.entity';
import { Tenant } from '../modules/tenant/tenant.entity';
import { RefreshToken } from '../modules/auth/refresh-token.entity';
import { config } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  entities: [Usuario, Propiedad, Anuncio, Transaccion, Tenant, RefreshToken],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});