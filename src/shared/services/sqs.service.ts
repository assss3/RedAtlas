import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Mock SQS Service using file system for inter-process communication
export class SQSService {
  private queueFile = join(process.cwd(), 'mock-sqs-queue.json');

  constructor() {
    console.log('🔧 Using mock SQS service for development');
    if (!existsSync(this.queueFile)) {
      this.saveMessages([]);
    }
  }

  private loadMessages(): any[] {
    try {
      const data = readFileSync(this.queueFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveMessages(messages: any[]): void {
    writeFileSync(this.queueFile, JSON.stringify(messages, null, 2));
  }

  async sendMessage(messageBody: any, groupId?: string): Promise<void> {
    const messages = this.loadMessages();
    
    // Generar ID único basado en contenido para deduplicación
    const contentHash = this.generateContentHash(messageBody);
    
    const message = {
      Body: JSON.stringify(messageBody),
      ReceiptHandle: `receipt-${Date.now()}-${Math.random()}`,
      MessageId: contentHash,
      Attributes: {
        SentTimestamp: Date.now().toString(),
        ApproximateReceiveCount: '1'
      }
    };
    
    messages.push(message);
    this.saveMessages(messages);
    console.log(`📤 Mock SQS: Sent message ${contentHash} for group ${groupId}`);
  }

  private generateContentHash(messageBody: any): string {
    const content = `${messageBody.importId}-batch-${messageBody.batchNumber}-size-${messageBody.batch?.length || 0}`;
    return createHash('sha256').update(content).digest('hex').substring(0, 32);
  }

  async receiveMessages(maxMessages: number = 10): Promise<any[]> {
    const messages = this.loadMessages();
    const received = messages.splice(0, maxMessages);
    this.saveMessages(messages);
    
    if (received.length > 0) {
      console.log(`📥 Mock SQS: Received ${received.length} messages`);
    }
    return received;
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    // In real SQS, this would delete the message from the queue
    // For mock, we already removed it in receiveMessages
    console.log(`🗑️ Mock SQS: Deleted message ${receiptHandle}`);
  }
}