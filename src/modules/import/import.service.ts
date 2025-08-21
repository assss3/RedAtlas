import { Readable } from 'stream';
import csv from 'csv-parser';
import { ImportRepository } from './import.repository';
import { PropiedadRepository } from '../propiedad/propiedad.repository';
import { SQSService } from '../../shared/services/sqs.service';
import { LockService } from '../../shared/services/lock.service';
import { CacheService } from '../../shared/services/cache.service';
import { ImportValidator } from './import.validator';

import { ImportStatus, PropertyImportRow, ProcessedPropertyRow, BatchProcessMessage, ImportError } from './import.interfaces';
import { config } from '../../config/env';
import { ValidationError } from '../../core/errors';

export class ImportService {
  constructor(
    private importRepository: ImportRepository,
    private propiedadRepository: PropiedadRepository,
    private sqsService: SQSService,
    private lockService: LockService = LockService.getInstance(),
    private cacheService: CacheService = CacheService.getInstance()
  ) {}

  async processCSVImport(
    fileStream: Readable,
    filename: string,
    tenantId: string,
    userId: string,
    fileHash: string,
    fileSize: number
  ): Promise<{ importId: string; message: string }> {
    const lockKey = `import_lock:${fileHash}`;
    
    return await this.lockService.withLock(lockKey, 300, async () => {

      const importJob = await this.importRepository.create({
        tenantId,
        userId,
        filename,
        status: ImportStatus.PENDING,
        fileHash,
        fileSize
      });

      this.processCSVStream(fileStream, importJob.id, tenantId).catch(error => {
        console.error(`Import ${importJob.id} failed:`, error);
        this.importRepository.updateStatus(importJob.id, ImportStatus.FAILED);
      });

      return {
        importId: importJob.id,
        message: 'Import started successfully'
      };
    });
  }

  private async processCSVStream(stream: Readable, importId: string, tenantId: string): Promise<void> {
    await this.importRepository.updateStatus(importId, ImportStatus.PROCESSING);

    const batch: ProcessedPropertyRow[] = [];
    const errors: ImportError[] = [];
    let rowNumber = 0;
    let batchNumber = 0;
    let totalRows = 0;
    let processing = false;

    return new Promise((resolve, reject) => {
      const csvStream = stream.pipe(csv());
      
      csvStream.on('data', async (row: PropertyImportRow) => {
        if (processing) {
          csvStream.pause();
          await new Promise(resolve => setImmediate(resolve));
          csvStream.resume();
        }
        
        processing = true;
        rowNumber++;
        totalRows++;

        try {
          const validation = ImportValidator.validateRow(row, rowNumber);
          
          if (validation.isValid && validation.data) {
            validation.data.tenantId = tenantId;

            batch.push(validation.data);
          } else {
            errors.push(...validation.errors);
          }

          if (batch.length >= 1000) {
            await this.sendBatchToQueue(importId, tenantId, [...batch], ++batchNumber, 0);
            batch.length = 0;
            global.gc && global.gc();
          }

          if (errors.length >= 50) {
            await this.importRepository.addErrors(importId, [...errors]);
            errors.length = 0;
          }
        } finally {
          processing = false;
        }
      })
        .on('end', async () => {
          try {
            if (batch.length > 0) {
              await this.sendBatchToQueue(importId, tenantId, [...batch], ++batchNumber, 0);
            }

            if (errors.length > 0) {
              await this.importRepository.addErrors(importId, [...errors]);
            }

            await this.importRepository.updateTotalRows(importId, totalRows);
            
            console.log(`CSV processing completed for import ${importId}. Total rows: ${totalRows}, Batches: ${batchNumber}`);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private async sendBatchToQueue(
    importId: string,
    tenantId: string,
    batch: ProcessedPropertyRow[],
    batchNumber: number,
    totalRows: number
  ): Promise<void> {
    const message: BatchProcessMessage = {
      importId,
      tenantId,
      batch: [...batch],
      batchNumber,
      totalBatches: Math.ceil(totalRows / 2000)
    };

    await this.sqsService.sendMessage(message, importId);
    console.log(`Sent batch ${batchNumber} to queue for import ${importId} (${batch.length} properties)`);
  }

  async processBatch(message: BatchProcessMessage): Promise<void> {
    const { importId, tenantId, batch } = message;
    const lockKey = `batch_lock:${importId}:${message.batchNumber}`;
    
    await this.lockService.withLock(lockKey, 60, async () => {
      try {
        const results = await this.propiedadRepository.upsertBatch(batch, tenantId);
        
        await this.importRepository.updateProgress(
          importId,
          results.processed,
          results.success,
          results.errors
        );

        await this.cacheService.invalidateEntity('property', tenantId);

        console.log(`Processed batch for import ${importId}: ${results.success} success, ${results.errors} errors`);
        
        await this.checkImportCompletion(importId);
        
      } catch (error) {
        console.error(`Error processing batch for import ${importId}:`, error);
        await this.importRepository.updateStatus(importId, ImportStatus.FAILED);
        throw error;
      }
    });
  }

  private async checkImportCompletion(importId: string): Promise<void> {
    const job = await this.importRepository.findByIdOnly(importId);
    if (!job) return;

    if (job.processedRows >= job.totalRows && job.status === ImportStatus.PROCESSING) {
      await this.importRepository.updateStatus(importId, ImportStatus.COMPLETED);
      console.log(`Import ${importId} completed successfully`);
    }
  }

  async getImportStatus(importId: string, tenantId: string): Promise<any> {
    const cacheKey = `import_status:${tenantId}:${importId}`;
    
    return await this.cacheService.getOrSet(
      cacheKey,
      10,
      async () => {
        const job = await this.importRepository.findById(importId, tenantId);
        if (!job || job.tenantId !== tenantId) {
          throw new ValidationError('Import job not found');
        }

        return {
          id: job.id,
          filename: job.filename,
          status: job.status,
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          successRows: job.successRows,
          errorRows: job.errorRows,
          errors: job.errors.slice(0, 50),
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        };
      }
    );
  }

  async findByFileHash(tenantId: string, fileHash: string): Promise<any | null> {
    return await this.importRepository.findByFileHash(tenantId, fileHash);
  }

  async getImportHistory(tenantId: string): Promise<any[]> {
    const cacheKey = `import_history:${tenantId}`;
    
    return await this.cacheService.getOrSet(
      cacheKey,
      60,
      async () => {
        const jobs = await this.importRepository.findByTenant(tenantId);
        return jobs.map(job => ({
          id: job.id,
          filename: job.filename,
          status: job.status,
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          successRows: job.successRows,
          errorRows: job.errorRows,
          fileHash: job.fileHash,
          fileSize: job.fileSize,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }));
      }
    );
  }
}