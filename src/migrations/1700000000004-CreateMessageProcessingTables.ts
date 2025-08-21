import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageProcessingTables1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla para tracking de mensajes procesados (deduplicación)
    await queryRunner.query(`
      CREATE TABLE processed_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id VARCHAR(255) UNIQUE NOT NULL,
        batch_id VARCHAR(255) NOT NULL,
        import_id UUID NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'completed'
      )
    `);
    
    await queryRunner.query(`CREATE INDEX idx_processed_messages_message_id ON processed_messages (message_id)`);
    await queryRunner.query(`CREATE INDEX idx_processed_messages_batch_id ON processed_messages (batch_id)`);

    // Tabla para mensajes con error (DLQ)
    await queryRunner.query(`
      CREATE TABLE mensajes_con_error (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id VARCHAR(255) NOT NULL,
        batch_id VARCHAR(255) NOT NULL,
        import_id UUID NOT NULL,
        message_body JSONB NOT NULL,
        error_details JSONB NOT NULL,
        retry_count INTEGER DEFAULT 0,
        first_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        final_error_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await queryRunner.query(`CREATE INDEX idx_mensajes_error_message_id ON mensajes_con_error (message_id)`);
    await queryRunner.query(`CREATE INDEX idx_mensajes_error_import_id ON mensajes_con_error (import_id)`);

    // Tabla para tracking de reintentos
    await queryRunner.query(`
      CREATE TABLE message_retries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id VARCHAR(255) NOT NULL,
        attempt_number INTEGER NOT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,
        error_stack TEXT
      )
    `);
    
    await queryRunner.query(`CREATE INDEX idx_message_retries_message_id ON message_retries (message_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS message_retries');
    await queryRunner.query('DROP TABLE IF EXISTS mensajes_con_error');
    await queryRunner.query('DROP TABLE IF EXISTS processed_messages');
  }
}