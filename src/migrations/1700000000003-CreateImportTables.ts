import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateImportTables1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'import_jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: "'pending'",
          },
          {
            name: 'total_rows',
            type: 'integer',
            default: 0,
          },
          {
            name: 'processed_rows',
            type: 'integer',
            default: 0,
          },
          {
            name: 'success_rows',
            type: 'integer',
            default: 0,
          },
          {
            name: 'error_rows',
            type: 'integer',
            default: 0,
          },
          {
            name: 'errors',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['tenant_id'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'usuarios',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'import_jobs',
      new TableIndex({
        name: 'idx_import_jobs_tenant_id',
        columnNames: ['tenant_id']
      })
    );

    await queryRunner.createIndex(
      'import_jobs',
      new TableIndex({
        name: 'idx_import_jobs_status',
        columnNames: ['status']
      })
    );

    // Skip unique index creation due to existing duplicate data
    // await queryRunner.query(`
    //   CREATE UNIQUE INDEX IF NOT EXISTS idx_propiedades_upsert_key 
    //   ON propiedades (tenant_id, title, calle, altura) 
    //   WHERE deleted_at IS NULL
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_propiedades_upsert_key');
    await queryRunner.dropTable('import_jobs');
  }
}