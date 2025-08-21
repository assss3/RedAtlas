import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { SQSService } from '../shared/services/sqs.service';
import { ImportService } from '../modules/import/import.service';
import { ImportRepository } from '../modules/import/import.repository';
import { PropiedadRepository } from '../modules/propiedad/propiedad.repository';
import { BatchProcessMessage } from '../modules/import/import.interfaces';
import { MessageProcessorService } from '../shared/services/message-processor.service';

class ImportWorker {
  private sqsService: SQSService;
  private importService: ImportService;
  private isRunning = false;

  constructor() {
    this.sqsService = new SQSService();
    this.messageProcessor = MessageProcessorService.getInstance();
    
    const importRepository = new ImportRepository();
    const propiedadRepository = new PropiedadRepository();
    this.importService = new ImportService(importRepository, propiedadRepository, this.sqsService);
  }

  private messageProcessor: MessageProcessorService;

  async start(): Promise<void> {
    await AppDataSource.initialize();
    console.log('🔗 Database connected for import worker');

    // Limpiar cola SQS al iniciar
    await this.clearQueue();
    console.log('🧹 Queue cleared on startup');

    this.isRunning = true;
    console.log('🚀 Import worker started');

    while (this.isRunning) {
      try {
        await this.processMessages();
        await this.sleep(1000);
      } catch (error) {
        console.error('❌ Error in worker loop:', error);
        await this.sleep(5000);
      }
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping import worker...');
    this.isRunning = false;
    await AppDataSource.destroy();
  }

  private async processMessages(): Promise<void> {
    const messages = await this.sqsService.receiveMessages(10);
    
    if (messages.length === 0) {
      return;
    }

    console.log(`📨 Received ${messages.length} messages`);

    for (const message of messages) {
      if (!message.Body || !message.ReceiptHandle || !message.MessageId) {
        continue;
      }

      try {
        const batchMessage: BatchProcessMessage = JSON.parse(message.Body);
        console.log(`🔄 Processing batch ${batchMessage.batchNumber} for import ${batchMessage.importId} (msg: ${message.MessageId})`);

        // Procesar mensaje con lógica de deduplicación y reintentos
        const result = await this.messageProcessor.processMessageSafely(
          message.MessageId,
          batchMessage,
          async () => {
            return await this.importService.processBatch(batchMessage);
          }
        );

        if (result.success) {
          await this.sqsService.deleteMessage(message.ReceiptHandle!);
          console.log(`✅ Completed batch ${batchMessage.batchNumber} for import ${batchMessage.importId}`);
        } else {
          // El mensaje fallará y será reintentado o movido a DLQ
          console.warn(`⚠️ Batch ${batchMessage.batchNumber} processing failed, will be retried`);
        }
        
      } catch (error) {
        console.error('❌ Error processing message:', error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Limpiar cola SQS y memoria de procesamiento
  private async clearQueue(): Promise<void> {
    // Limpiar archivo de cola mock
    const fs = require('fs');
    const path = require('path');
    const queueFile = path.join(process.cwd(), 'mock-sqs-queue.json');
    fs.writeFileSync(queueFile, '[]');
    
    // Limpiar mensajes procesados
    await AppDataSource.query('DELETE FROM processed_messages');
    
    console.log('🧹 Cleared SQS queue and processed messages');
  }

  // Método para obtener estadísticas de procesamiento
  async getStats(): Promise<void> {
    const stats = await this.messageProcessor.getProcessingStats();
    console.log('📊 Processing Stats:', {
      processed: stats.processed,
      errors: stats.errors,
      retries: stats.retries
    });
  }
}

const worker = new ImportWorker();

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

worker.start().catch(error => {
  console.error('💥 Failed to start import worker:', error);
  process.exit(1);
});