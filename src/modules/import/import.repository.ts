import { AppDataSource } from '../../config/database';
import { ImportJob } from './import.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';
import { ImportStatus, ImportError } from './import.interfaces';

export class ImportRepository extends BaseRepositoryImpl<ImportJob> {
  protected orderConfig = {
    allowedFields: ['createdAt', 'status'],
    defaultField: 'createdAt',
    defaultDirection: 'DESC' as const
  };

  constructor() {
    super(AppDataSource.getRepository(ImportJob));
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ImportJob | null> {
    return await this.repository.findOne({
      where: { idempotencyKey }
    });
  }

  async updateStatus(id: string, status: ImportStatus): Promise<void> {
    await this.repository.update(id, { status });
  }

  async updateProgress(id: string, processedRows: number, successRows: number, errorRows: number): Promise<void> {
    await this.repository.query(
      `UPDATE import_jobs SET 
        processed_rows = processed_rows + $2,
        success_rows = success_rows + $3,
        error_rows = error_rows + $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id, processedRows, successRows, errorRows]
    );
  }

  async addErrors(id: string, errors: ImportError[]): Promise<void> {
    const job = await this.repository.findOne({ where: { id } });
    if (job) {
      const updatedErrors = [...job.errors, ...errors];
      await this.repository.update(id, { errors: updatedErrors });
    }
  }

  async updateTotalRows(id: string, totalRows: number): Promise<void> {
    await this.repository.update(id, { totalRows });
  }

  async findByTenant(tenantId: string, limit: number = 50): Promise<ImportJob[]> {
    return await this.repository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async findByIdOnly(id: string): Promise<ImportJob | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByFileHash(tenantId: string, fileHash: string): Promise<ImportJob | null> {
    return await this.repository.findOne({
      where: { tenantId, fileHash }
    });
  }
}