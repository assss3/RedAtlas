import { config, validateConfig } from './config/env';
import { AppDataSource } from './config/database';
import { app } from './app';

async function startServer() {
  try {
    // Validate environment configuration
    validateConfig();
    
    // Inicializar conexión a la base de datos
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();