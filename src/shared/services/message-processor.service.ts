import { AppDataSource } from '../../config/database';

export interface ProcessedMessage {
  id: string;
  messageId: string;
  batchId: string;
  importId: string;
  processedAt: Date;
  status: string;
}

export interface MessageError {
  id: string;
  messageId: string;
  batchId: string;
  importId: string;
  messageBody: any;
  errorDetails: any;
  retryCount: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
  finalErrorAt: Date;
}

export class MessageProcessorService {
  private static instance: MessageProcessorService;

  static getInstance(): MessageProcessorService {
    if (!MessageProcessorService.instance) {
      MessageProcessorService.instance = new MessageProcessorService();
    }
    return MessageProcessorService.instance;
  }

  // 1. DEDUPLICACIÓN: Verificar si el mensaje ya fue procesado
  async isMessageProcessed(messageId: string): Promise<boolean> {
    const result = await AppDataSource.query(
      'SELECT 1 FROM processed_messages WHERE message_id = $1 LIMIT 1',
      [messageId]
    );
    return result.length > 0;
  }

  // Marcar mensaje como procesado
  async markMessageAsProcessed(messageId: string, batchId: string, importId: string): Promise<void> {
    await AppDataSource.query(
      `INSERT INTO processed_messages (message_id, batch_id, import_id, status) 
       VALUES ($1, $2, $3, 'completed') 
       ON CONFLICT (message_id) DO NOTHING`,
      [messageId, batchId, importId]
    );
  }

  // 2. REINTENTOS: Obtener número de intentos
  async getRetryCount(messageId: string): Promise<number> {
    const result = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM message_retries WHERE message_id = $1',
      [messageId]
    );
    return parseInt(result[0].count);
  }

  // Registrar intento de procesamiento
  async recordRetryAttempt(messageId: string, attemptNumber: number, error?: Error): Promise<void> {
    await AppDataSource.query(
      `INSERT INTO message_retries (message_id, attempt_number, error_message, error_stack) 
       VALUES ($1, $2, $3, $4)`,
      [messageId, attemptNumber, error?.message || null, error?.stack || null]
    );
  }

  // 3. MANEJO DE ERRORES FATALES: Mover a DLQ
  async moveToDeadLetterQueue(
    messageId: string, 
    batchId: string, 
    importId: string, 
    messageBody: any, 
    finalError: Error,
    retryCount: number
  ): Promise<void> {
    const errorDetails = {
      message: finalError.message,
      stack: finalError.stack,
      name: finalError.name,
      timestamp: new Date().toISOString()
    };

    await AppDataSource.query(
      `INSERT INTO mensajes_con_error 
       (message_id, batch_id, import_id, message_body, error_details, retry_count) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [messageId, batchId, importId, JSON.stringify(messageBody), JSON.stringify(errorDetails), retryCount]
    );

    console.error(`❌ Message ${messageId} moved to DLQ after ${retryCount} retries:`, finalError.message);
  }

  // Generar ID único para mensaje basado en contenido
  generateMessageId(batchMessage: any): string {
    const content = `${batchMessage.importId}-batch-${batchMessage.batchNumber}-size-${batchMessage.batch?.length || 0}`;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32);
  }

  // Procesar mensaje con lógica completa de reintentos y deduplicación
  async processMessageSafely<T>(
    messageId: string,
    messageBody: any,
    processor: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    const MAX_RETRIES = 2;
    
    // 1. Verificar deduplicación
    if (await this.isMessageProcessed(messageId)) {
      console.log(`⚠️ Message ${messageId} already processed, skipping`);
      return { success: true };
    }

    // 2. Verificar número de reintentos
    const currentRetries = await this.getRetryCount(messageId);
    if (currentRetries >= MAX_RETRIES) {
      const error = new Error(`Message exceeded maximum retries (${MAX_RETRIES})`);
      await this.moveToDeadLetterQueue(
        messageId,
        messageBody.batchNumber?.toString() || 'unknown',
        messageBody.importId || 'unknown',
        messageBody,
        error,
        currentRetries
      );
      return { success: false, error };
    }

    // 3. Intentar procesamiento
    try {
      const result = await processor();
      
      // Marcar como procesado exitosamente
      await this.markMessageAsProcessed(
        messageId, 
        messageBody.batchNumber?.toString() || 'unknown',
        messageBody.importId || 'unknown'
      );
      
      console.log(`✅ Message ${messageId} processed successfully`);
      return { success: true, result };
      
    } catch (error) {
      const attemptNumber = currentRetries + 1;
      await this.recordRetryAttempt(messageId, attemptNumber, error as Error);
      
      if (attemptNumber >= MAX_RETRIES) {
        // Mover a DLQ después del último intento
        await this.moveToDeadLetterQueue(
          messageId,
          messageBody.batchNumber?.toString() || 'unknown',
          messageBody.importId || 'unknown',
          messageBody,
          error as Error,
          attemptNumber
        );
        console.error(`❌ Message ${messageId} failed after ${attemptNumber} attempts`);
      } else {
        console.warn(`⚠️ Message ${messageId} failed attempt ${attemptNumber}/${MAX_RETRIES}, will retry`);
      }
      
      return { success: false, error: error as Error };
    }
  }

  // Obtener estadísticas de procesamiento
  async getProcessingStats(): Promise<{
    processed: number;
    errors: number;
    retries: number;
  }> {
    const [processedResult, errorsResult, retriesResult] = await Promise.all([
      AppDataSource.query('SELECT COUNT(*) as count FROM processed_messages'),
      AppDataSource.query('SELECT COUNT(*) as count FROM mensajes_con_error'),
      AppDataSource.query('SELECT COUNT(*) as count FROM message_retries')
    ]);

    return {
      processed: parseInt(processedResult[0].count),
      errors: parseInt(errorsResult[0].count),
      retries: parseInt(retriesResult[0].count)
    };
  }
}