import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFileHashToImportJobs1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE import_jobs 
      ADD COLUMN file_hash VARCHAR(64),
      ADD COLUMN file_size BIGINT
    `);
    
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_import_jobs_tenant_hash 
      ON import_jobs (tenant_id, file_hash) 
      WHERE file_hash IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_import_jobs_tenant_hash');
    await queryRunner.query('ALTER TABLE import_jobs DROP COLUMN IF EXISTS file_hash, DROP COLUMN IF EXISTS file_size');
  }
}