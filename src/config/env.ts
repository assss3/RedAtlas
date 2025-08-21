import dotenv from 'dotenv';

dotenv.config();

// Validation function to ensure required environment variables are set
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

function requireEnvInt(name: string): number {
  const value = requireEnv(name);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer, got: ${value}`);
  }
  return parsed;
}

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function getEnvInt(name: string): number | undefined {
  const value = getEnv(name);
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer, got: ${value}`);
  }
  return parsed;
}

export const config = {
  // Server Configuration
  port: requireEnvInt('PORT'),
  nodeEnv: requireEnv('NODE_ENV'),

  // JWT Configuration
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: requireEnv('JWT_EXPIRES_IN'),
    refreshSecret: requireEnv('REFRESH_TOKEN_SECRET'),
    refreshExpiresIn: requireEnv('REFRESH_TOKEN_EXPIRES_IN'),
  },

  // Database Configuration
  db: {
    host: requireEnv('DB_HOST'),
    port: requireEnvInt('DB_PORT'),
    username: requireEnv('DB_USERNAME'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
  },

  // Redis Configuration
  redis: {
    host: requireEnv('REDIS_HOST'),
    port: requireEnvInt('REDIS_PORT'),
    password: getEnv('REDIS_PASSWORD'), // Optional
    db: requireEnvInt('REDIS_DB'),
  },

  // Seed Configuration
  seed: {
    batchSize: requireEnvInt('SEED_BATCH_SIZE'),
  },
};

// Validate configuration on startup
export function validateConfig(): void {
  try {
    // Test all required configurations
    config.port;
    config.nodeEnv;
    config.jwt.secret;
    config.jwt.expiresIn;
    config.jwt.refreshSecret;
    config.jwt.refreshExpiresIn;
    config.db.host;
    config.db.port;
    config.db.username;
    config.db.password;
    config.db.database;
    config.redis.host;
    config.redis.port;
    config.redis.db;
    config.seed.batchSize;

    console.log('✅ Environment configuration validated successfully');
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error);
    process.exit(1);
  }
}