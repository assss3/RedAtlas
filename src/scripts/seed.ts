import 'reflect-metadata';
import { config } from 'dotenv';
config();
import { AppDataSource } from '../config/database';
import { Usuario } from '../modules/usuario/usuario.entity';
import { Tenant } from '../modules/tenant/tenant.entity';
import { Propiedad } from '../modules/propiedad/propiedad.entity';
import { Anuncio } from '../modules/anuncio/anuncio.entity';
import { Transaccion } from '../modules/transaccion/transaccion.entity';
import { UserRole, TransactionStatus, PropertyType, OperationType, AnuncioStatus, PropiedadStatus } from '../core/interfaces';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('🔗 Database connected');

    const userRepo = AppDataSource.getRepository(Usuario);
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const propiedadRepo = AppDataSource.getRepository(Propiedad);
    const anuncioRepo = AppDataSource.getRepository(Anuncio);
    const transaccionRepo = AppDataSource.getRepository(Transaccion);

    // Crear tenants
    const tenant1 = await tenantRepo.save({
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Tenant Uno'
    });

    const tenant2 = await tenantRepo.save({
      id: '550e8400-e29b-41d4-a716-446655440020',
      name: 'Tenant Dos'
    });

    // Admin para tenant 1
    await userRepo.save({
      id: '550e8400-e29b-41d4-a716-446655440001',
      nombre: 'Admin Tenant 1',
      email: 'admin1@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      rol: UserRole.ADMIN,
      tenantId: tenant1.id
    });

    // Usuario regular en tenant 1
    const usuario = await userRepo.save({
      id: '550e8400-e29b-41d4-a716-446655440003',
      nombre: 'Usuario Regular',
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('user123', 10),
      rol: UserRole.USER,
      tenantId: tenant1.id
    });

    // Crear propiedad con ubicación
    const propiedad = await AppDataSource.query(
      `INSERT INTO propiedades (id, tenant_id, title, tipo, ambientes, superficie, pais, ciudad, calle, altura, location, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_GeomFromText($11), 4326)::geography, $12) 
       RETURNING *`,
      [
        '550e8400-e29b-41d4-a716-446655440100',
        tenant1.id,
        'Casa en Palermo',
        PropertyType.CASA,
        3,
        120.50,
        'Argentina',
        'Buenos Aires',
        'Av. Santa Fe',
        '1234',
        'POINT(-58.4173 -34.5875)',
        PropiedadStatus.DISPONIBLE
      ]
    ).then(result => result[0]);

    // Crear anuncio
    const anuncio = await anuncioRepo.save({
      id: '550e8400-e29b-41d4-a716-446655440200',
      tenantId: tenant1.id,
      propertyId: propiedad.id,
      description: 'Hermosa casa de 3 ambientes en el corazón de Palermo. Totalmente renovada con excelente ubicación cerca del transporte público.',
      tipo: OperationType.VENTA,
      price: 250000.00,
      status: AnuncioStatus.ACTIVO
    });

    // Crear transacción
    const transaccion = await transaccionRepo.save({
      id: '550e8400-e29b-41d4-a716-446655440300',
      tenantId: tenant1.id,
      anuncioId: anuncio.id,
      userId: usuario.id,
      amount: 250000.00,
      status: TransactionStatus.PENDIENTE
    });

    console.log('✅ Seed completed successfully');
    console.log(`📋 Tenant 1: ${tenant1.id} - ${tenant1.name}`);
    console.log(`📋 Tenant 2: ${tenant2.id} - ${tenant2.name}`);
    console.log('👤 Admin: 550e8400-e29b-41d4-a716-446655440001 (Tenant 1)');
    console.log('👤 User: 550e8400-e29b-41d4-a716-446655440003 (Tenant 1)');
    console.log(`🏠 Propiedad: ${propiedad.id} - ${propiedad.title}`);
    console.log(`📢 Anuncio: ${anuncio.id} - Propiedad ${propiedad.title}`);
    console.log(`💰 Transacción: ${transaccion.id} - $${transaccion.amount} (${transaccion.status})`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();