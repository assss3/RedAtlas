import 'reflect-metadata';
import { Client } from 'pg';
import { v5 as uuidv5 } from 'uuid';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';

// Configuración
const BATCH_SIZE = config.seed.batchSize;
const SEED_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const RNG_SEED = 42; // Seed fija para reproducibilidad

// Tenants fijos
const TENANTS = {
  T1: { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Inmobiliaria Argentina' },
  T2: { id: '550e8400-e29b-41d4-a716-446655440020', name: 'Inmobiliaria Uruguay' }
};

const USUARIOS = {
  T1_ADMIN: { id: '550e8400-e29b-41d4-a716-446655440001', email: 'admin@argentina.com', rol: 'ADMIN' },
  T1_USER: { id: '550e8400-e29b-41d4-a716-446655440003', email: 'user@argentina.com', rol: 'USER' },
  T2_ADMIN: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', email: 'admin@uruguay.com', rol: 'ADMIN' },
  T2_USER: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', email: 'user@uruguay.com', rol: 'USER' }
};

// Bounding boxes y datos por tenant
const TENANT_DATA = {
  [TENANTS.T1.id]: {
    ciudades: [
      { nombre: 'Buenos Aires', bbox: { minLat: -34.7056, maxLat: -34.5265, minLng: -58.5315, maxLng: -58.3354 }, basePrice: 180000 },
      { nombre: 'Córdoba', bbox: { minLat: -31.4689, maxLat: -31.3589, minLng: -64.2344, maxLng: -64.1344 }, basePrice: 120000 },
      { nombre: 'Rosario', bbox: { minLat: -32.9889, maxLat: -32.8889, minLng: -60.7089, maxLng: -60.6089 }, basePrice: 100000 }
    ],
    pais: 'Argentina'
  },
  [TENANTS.T2.id]: {
    ciudades: [
      { nombre: 'Montevideo', bbox: { minLat: -34.9389, maxLat: -34.8389, minLng: -56.2389, maxLng: -56.1389 }, basePrice: 150000 },
      { nombre: 'Punta del Este', bbox: { minLat: -34.9789, maxLat: -34.8789, minLng: -55.0089, maxLng: -54.9089 }, basePrice: 250000 }
    ],
    pais: 'Uruguay'
  }
};

const TIPOS_PROPIEDAD = ['departamento', 'casa', 'terreno', 'local', 'oficina'];
const TIPOS_ANUNCIO = ['venta', 'alquiler'];
const STATUS_TRANSACCION = ['pendiente', 'completada', 'cancelada'];
const CALLES = ['Av. Libertador', 'Av. Corrientes', 'Av. Santa Fe', 'San Martín', 'Belgrano', 'Mitre', '25 de Mayo', 'Rivadavia'];

// RNG determinístico
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

const rng = new SeededRandom(RNG_SEED);

// Generador de UUID determinístico
function generateDeterministicUUID(type: string, index: number, tenantId: string): string {
  return uuidv5(`${type}-${index}-${tenantId}`, SEED_NAMESPACE);
}

// Generador de fechas en últimos 18 meses
function generateRandomDate(): Date {
  const now = new Date();
  const eighteenMonthsAgo = new Date(now.getTime() - (18 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = rng.nextFloat(eighteenMonthsAgo.getTime(), now.getTime());
  return new Date(randomTime);
}

// Generador de coordenadas en bounding box
function generateCoordinates(bbox: any): { lat: number, lng: number } {
  return {
    lat: rng.nextFloat(bbox.minLat, bbox.maxLat),
    lng: rng.nextFloat(bbox.minLng, bbox.maxLng)
  };
}

// Generador de precios
function generatePrice(basePrice: number, tipo: string, operationType: string): number {
  let multiplier = 1;
  
  // Ajuste por tipo de propiedad
  switch (tipo) {
    case 'casa': multiplier *= 1.3; break;
    case 'departamento': multiplier *= 1.0; break;
    case 'terreno': multiplier *= 0.7; break;
    case 'local': multiplier *= 1.5; break;
    case 'oficina': multiplier *= 1.2; break;
  }
  
  // Ajuste por tipo de operación
  if (operationType === 'alquiler') {
    multiplier *= 0.008; // ~0.8% del valor de venta
  }
  
  // Ruido aleatorio ±30%
  const noise = rng.nextFloat(0.7, 1.3);
  
  return Math.round(basePrice * multiplier * noise);
}

async function seed() {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.username,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    await client.connect();
    console.log('🔗 Database connected');

    // Verificar si las tablas existen
    try {
      const { rows: existingData } = await client.query('SELECT COUNT(*) as count FROM propiedades');
      if (parseInt(existingData[0].count) > 0) {
        console.log('⚠️  Data already exists. Skipping seed...');
        return;
      }
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('❌ Tables do not exist. Please run migrations first: npm run migration:run');
        return;
      }
      throw error;
    }

    // Habilitar extensiones
    await client.query('CREATE EXTENSION IF NOT EXISTS "postgis"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    console.log('✅ Extensions enabled');

    // 1. Crear tenants
    await seedTenants(client);
    
    // 2. Crear usuarios
    await seedUsuarios(client);
    
    // 3. Crear propiedades (100k total, 50k per tenant)
    const bloques = await seedPropiedades(client, 100000);
    
    // 4. Crear anuncios (200k total, 100k per tenant)
    const anunciosData = await seedAnuncios(client, bloques, 200000);
    
    // 5. Crear transacciones (150k total, 75k per tenant)
    await seedTransacciones(client, anunciosData, 150000);

    console.log('✅ Seed completed successfully');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function seedTenants(client: Client) {
  console.log('📋 Creating tenants...');
  
  await client.query(`
    INSERT INTO tenants (id, name, active) VALUES 
    ($1, $2, true),
    ($3, $4, true)
    ON CONFLICT (id) DO NOTHING
  `, [TENANTS.T1.id, TENANTS.T1.name, TENANTS.T2.id, TENANTS.T2.name]);
}

async function seedUsuarios(client: Client) {
  console.log('👤 Creating usuarios...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await client.query(`
    INSERT INTO usuarios (id, tenant_id, nombre, email, password_hash, rol) VALUES 
    ($1, $2, 'Admin Argentina', $3, $4, $5),
    ($6, $2, 'User Argentina', $7, $4, $8),
    ($9, $10, 'Admin Uruguay', $11, $4, $12),
    ($13, $10, 'User Uruguay', $14, $4, $15)
    ON CONFLICT (id) DO NOTHING
  `, [
    USUARIOS.T1_ADMIN.id, TENANTS.T1.id, USUARIOS.T1_ADMIN.email, passwordHash, USUARIOS.T1_ADMIN.rol,
    USUARIOS.T1_USER.id, USUARIOS.T1_USER.email, USUARIOS.T1_USER.rol,
    USUARIOS.T2_ADMIN.id, TENANTS.T2.id, USUARIOS.T2_ADMIN.email, USUARIOS.T2_ADMIN.rol,
    USUARIOS.T2_USER.id, USUARIOS.T2_USER.email, USUARIOS.T2_USER.rol
  ]);
}

// Generar bloques estructurados de datos
function generateDataBlocks(totalPropiedades: number, totalAnuncios: number, totalTransacciones: number) {
  const bloques: any[] = [];
  const tenantIds = Object.keys(TENANT_DATA);
  
  // Calcular cuántos bloques necesitamos (cada bloque = 1 propiedad + 2 anuncios)
  const bloquesNecesarios = Math.ceil(totalPropiedades / 1);
  const bloquesCompletos = Math.floor(bloquesNecesarios / 3) * 3; // Múltiplo de 3 para los 3 tipos
  
  let propIndex = 0;
  let anuncioIndex = 0;
  let transIndex = 0;
  
  for (let i = 0; i < bloquesCompletos; i++) {
    const tenantId = tenantIds[Math.floor(i / (bloquesCompletos / tenantIds.length))];
    const tenantData = TENANT_DATA[tenantId];
    const ciudad = rng.choice(tenantData.ciudades);
    const tipo = rng.choice(TIPOS_PROPIEDAD);
    const coords = generateCoordinates(ciudad.bbox);
    const createdAt = generateRandomDate();
    
    const bloqueType = i % 3; // 0, 1, 2 para los 3 tipos de bloques
    
    // Crear propiedad base
    const propiedad = {
      id: generateDeterministicUUID('prop', propIndex++, tenantId),
      tenant_id: tenantId,
      title: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} en ${ciudad.nombre}`,
      tipo,
      ambientes: ['casa', 'departamento'].includes(tipo) ? rng.nextInt(1, 5) : null,
      superficie: rng.nextFloat(30, 300),
      pais: tenantData.pais,
      ciudad: ciudad.nombre,
      calle: rng.choice(CALLES),
      altura: rng.nextInt(100, 9999).toString(),
      location: `POINT(${coords.lng} ${coords.lat})`,
      status: 'disponible', // Se actualizará según el bloque
      created_at: createdAt,
      updated_at: createdAt
    };
    
    // Crear anuncios (venta y alquiler)
    const anuncioVenta = {
      id: generateDeterministicUUID('anun', anuncioIndex++, tenantId),
      tenant_id: tenantId,
      property_id: propiedad.id,
      description: `Venta de ${propiedad.tipo} en ${propiedad.ciudad}. Excelente ubicación.`,
      tipo: 'venta',
      price: generatePrice(ciudad.basePrice, propiedad.tipo, 'venta'),
      status: 'activo', // Se actualizará según el bloque
      created_at: createdAt,
      updated_at: createdAt
    };
    
    const anuncioAlquiler = {
      id: generateDeterministicUUID('anun', anuncioIndex++, tenantId),
      tenant_id: tenantId,
      property_id: propiedad.id,
      description: `Alquiler de ${propiedad.tipo} en ${propiedad.ciudad}. Excelente ubicación.`,
      tipo: 'alquiler',
      price: generatePrice(ciudad.basePrice, propiedad.tipo, 'alquiler'),
      status: 'activo', // Se actualizará según el bloque
      created_at: createdAt,
      updated_at: createdAt
    };
    
    const userId = tenantId === TENANTS.T1.id ? USUARIOS.T1_USER.id : USUARIOS.T2_USER.id;
    const transacciones: any[] = [];
    
    // Configurar según tipo de bloque
    if (bloqueType === 0) {
      // Bloque 1: Propiedad no disponible con anuncios reservados
      propiedad.status = 'no_disponible';
      anuncioVenta.status = 'reservado';
      anuncioAlquiler.status = 'reservado';
      
      // Transacción cancelada para venta
      transacciones.push({
        id: generateDeterministicUUID('trans', transIndex++, tenantId),
        tenant_id: tenantId,
        anuncio_id: anuncioVenta.id,
        user_id: userId,
        amount: anuncioVenta.price,
        status: 'cancelada',
        created_at: new Date(createdAt.getTime() + 86400000), // +1 día
        updated_at: new Date(createdAt.getTime() + 86400000)
      });
      
      // Transacción pendiente para alquiler
      transacciones.push({
        id: generateDeterministicUUID('trans', transIndex++, tenantId),
        tenant_id: tenantId,
        anuncio_id: anuncioAlquiler.id,
        user_id: userId,
        amount: anuncioAlquiler.price,
        status: 'pendiente',
        created_at: new Date(createdAt.getTime() + 172800000), // +2 días
        updated_at: new Date(createdAt.getTime() + 172800000)
      });
      
    } else if (bloqueType === 1) {
      // Bloque 2: Propiedad disponible con anuncios activos (sin transacciones)
      propiedad.status = 'disponible';
      anuncioVenta.status = 'activo';
      anuncioAlquiler.status = 'activo';
      // No transacciones
      
    } else {
      // Bloque 3: Propiedad no disponible con anuncios inactivos
      propiedad.status = 'no_disponible';
      anuncioVenta.status = 'inactivo';
      anuncioAlquiler.status = 'inactivo';
      
      // Transacción cancelada primero
      transacciones.push({
        id: generateDeterministicUUID('trans', transIndex++, tenantId),
        tenant_id: tenantId,
        anuncio_id: anuncioVenta.id,
        user_id: userId,
        amount: anuncioVenta.price,
        status: 'cancelada',
        created_at: new Date(createdAt.getTime() + 86400000), // +1 día
        updated_at: new Date(createdAt.getTime() + 86400000)
      });
      
      // Transacción completada después
      transacciones.push({
        id: generateDeterministicUUID('trans', transIndex++, tenantId),
        tenant_id: tenantId,
        anuncio_id: anuncioAlquiler.id,
        user_id: userId,
        amount: anuncioAlquiler.price,
        status: 'completada',
        created_at: new Date(createdAt.getTime() + 172800000), // +2 días
        updated_at: new Date(createdAt.getTime() + 172800000)
      });
    }
    
    bloques.push({
      propiedad,
      anuncios: [anuncioVenta, anuncioAlquiler],
      transacciones
    });
  }
  
  // Completar con datos aleatorios si necesitamos más registros
  while (propIndex < totalPropiedades) {
    const tenantId = rng.choice(tenantIds);
    const tenantData = TENANT_DATA[tenantId];
    const ciudad = rng.choice(tenantData.ciudades);
    const tipo = rng.choice(TIPOS_PROPIEDAD);
    const coords = generateCoordinates(ciudad.bbox);
    const createdAt = generateRandomDate();
    
    const propiedad = {
      id: generateDeterministicUUID('prop', propIndex++, tenantId),
      tenant_id: tenantId,
      title: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} en ${ciudad.nombre}`,
      tipo,
      ambientes: ['casa', 'departamento'].includes(tipo) ? rng.nextInt(1, 5) : null,
      superficie: rng.nextFloat(30, 300),
      pais: tenantData.pais,
      ciudad: ciudad.nombre,
      calle: rng.choice(CALLES),
      altura: rng.nextInt(100, 9999).toString(),
      location: `POINT(${coords.lng} ${coords.lat})`,
      status: rng.nextFloat(0, 1) < 0.7 ? 'disponible' : 'no_disponible',
      created_at: createdAt,
      updated_at: createdAt
    };
    
    bloques.push({ propiedad, anuncios: [], transacciones: [] });
  }
  
  return bloques;
}

async function seedPropiedades(client: Client, total: number): Promise<any[]> {
  console.log(`🏠 Creating ${total} propiedades...`);
  
  const bloques = generateDataBlocks(total, total * 2, total * 1.5);
  const propiedades = bloques.map(b => b.propiedad);
  
  // Inserción por lotes
  for (let i = 0; i < propiedades.length; i += BATCH_SIZE) {
    const batch = propiedades.slice(i, i + BATCH_SIZE);
    
    const values = batch.map((p, idx) => {
      const base = idx * 13;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, ST_SetSRID(ST_GeomFromText($${base + 11}), 4326)::geography, $${base + 12}, $${base + 13})`;
    }).join(', ');
    
    const params = batch.flatMap(p => [
      p.id, p.tenant_id, p.title, p.tipo, p.ambientes, p.superficie,
      p.pais, p.ciudad, p.calle, p.altura, p.location, p.status, p.created_at
    ]);
    
    await client.query(`
      INSERT INTO propiedades (id, tenant_id, title, tipo, ambientes, superficie, pais, ciudad, calle, altura, location, status, created_at)
      VALUES ${values}
      ON CONFLICT (id) DO NOTHING
    `, params);
    
    if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= propiedades.length) {
      console.log(`  📦 Propiedades: ${Math.min(i + BATCH_SIZE, propiedades.length)}/${propiedades.length}`);
    }
  }
  
  return bloques;
}

async function seedAnuncios(client: Client, bloques: any[], total: number): Promise<any> {
  console.log(`📢 Creating ${total} anuncios...`);
  
  const anuncios = bloques.flatMap(b => b.anuncios);
  
  // Completar con anuncios aleatorios solo en propiedades disponibles
  const propiedadesDisponibles = bloques.filter(b => b.propiedad.status === 'disponible');
  while (anuncios.length < total && propiedadesDisponibles.length > 0) {
    const bloque = rng.choice(propiedadesDisponibles);
    const propiedad = bloque.propiedad;
    const tenantData = TENANT_DATA[propiedad.tenant_id];
    const ciudad = tenantData.ciudades.find(c => c.nombre === propiedad.ciudad)!;
    const tipo = rng.choice(TIPOS_ANUNCIO);
    const price = generatePrice(ciudad.basePrice, propiedad.tipo, tipo);
    
    anuncios.push({
      id: generateDeterministicUUID('anun', anuncios.length, propiedad.tenant_id),
      tenant_id: propiedad.tenant_id,
      property_id: propiedad.id,
      description: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} de ${propiedad.tipo} en ${propiedad.ciudad}. Excelente ubicación.`,
      tipo,
      price,
      status: 'activo',
      created_at: propiedad.created_at,
      updated_at: propiedad.created_at
    });
  }
  
  // Inserción por lotes
  for (let i = 0; i < anuncios.length; i += BATCH_SIZE) {
    const batch = anuncios.slice(i, i + BATCH_SIZE);
    
    const values = batch.map((a, idx) => {
      const base = idx * 8;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
    }).join(', ');
    
    const params = batch.flatMap(a => [
      a.id, a.tenant_id, a.property_id, a.description, a.tipo, a.price, a.status, a.created_at
    ]);
    
    await client.query(`
      INSERT INTO anuncios (id, tenant_id, property_id, description, tipo, price, status, created_at)
      VALUES ${values}
      ON CONFLICT (id) DO NOTHING
    `, params);
    
    if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= anuncios.length) {
      console.log(`  📦 Anuncios: ${Math.min(i + BATCH_SIZE, anuncios.length)}/${anuncios.length}`);
    }
  }
  
  return { bloques, anuncios };
}

async function seedTransacciones(client: Client, data: any, total: number) {
  console.log(`💰 Creating ${total} transacciones...`);
  
  const { bloques, anuncios } = data;
  const transacciones = bloques.flatMap((b: any) => b.transacciones);
  
  // Completar con transacciones aleatorias si necesitamos más
  while (transacciones.length < total) {
    const anuncio: any = rng.choice(anuncios);
    const userId = anuncio.tenant_id === TENANTS.T1.id ? USUARIOS.T1_USER.id : USUARIOS.T2_USER.id;
    const status = rng.choice(STATUS_TRANSACCION);
    
    transacciones.push({
      id: generateDeterministicUUID('trans', transacciones.length, anuncio.tenant_id),
      tenant_id: anuncio.tenant_id,
      anuncio_id: anuncio.id,
      user_id: userId,
      amount: anuncio.price,
      status,
      created_at: new Date(anuncio.created_at.getTime() + rng.nextInt(0, 86400000)),
      updated_at: new Date(anuncio.created_at.getTime() + rng.nextInt(0, 86400000))
    });
  }
  
  // Inserción por lotes
  for (let i = 0; i < transacciones.length; i += BATCH_SIZE) {
    const batch = transacciones.slice(i, i + BATCH_SIZE);
    
    const values = batch.map((t: any, idx: number) => {
      const base = idx * 7;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
    }).join(', ');
    
    const params = batch.flatMap((t: any) => [
      t.id, t.tenant_id, t.anuncio_id, t.user_id, t.amount, t.status, t.created_at
    ]);
    
    await client.query(`
      INSERT INTO transacciones (id, tenant_id, anuncio_id, user_id, amount, status, created_at)
      VALUES ${values}
      ON CONFLICT (id) DO NOTHING
    `, params);
    
    if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= transacciones.length) {
      console.log(`  📦 Transacciones: ${Math.min(i + BATCH_SIZE, transacciones.length)}/${transacciones.length}`);
    }
  }
  
  console.log('✅ Datos estructurados en bloques creados correctamente');
}

if (require.main === module) {
  seed().catch(console.error);
}

export { seed };