import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIndexes1700000000002 implements MigrationInterface {
    name = 'AddTenantIndexes1700000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Índices individuales para tenant_id en todas las tablas
        await queryRunner.query(`CREATE INDEX "IDX_usuarios_tenant_id" ON "usuarios" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_tenant_id" ON "propiedades" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_tenant_id" ON "anuncios" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_transacciones_tenant_id" ON "transacciones" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_tenant_id" ON "refresh_tokens" ("tenant_id")`);
        
        // Índices compuestos optimizados para consultas multi-tenant frecuentes
        await queryRunner.query(`CREATE INDEX "IDX_usuarios_tenant_email" ON "usuarios" ("tenant_id", "email")`);
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_tenant_status" ON "propiedades" ("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_tenant_tipo" ON "propiedades" ("tenant_id", "tipo")`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_tenant_property" ON "anuncios" ("tenant_id", "property_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_tenant_status" ON "anuncios" ("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_transacciones_tenant_user" ON "transacciones" ("tenant_id", "user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_transacciones_tenant_anuncio" ON "transacciones" ("tenant_id", "anuncio_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar índices compuestos
        await queryRunner.query(`DROP INDEX "IDX_transacciones_tenant_anuncio"`);
        await queryRunner.query(`DROP INDEX "IDX_transacciones_tenant_user"`);
        await queryRunner.query(`DROP INDEX "IDX_anuncios_tenant_status"`);
        await queryRunner.query(`DROP INDEX "IDX_anuncios_tenant_property"`);
        await queryRunner.query(`DROP INDEX "IDX_propiedades_tenant_tipo"`);
        await queryRunner.query(`DROP INDEX "IDX_propiedades_tenant_status"`);
        await queryRunner.query(`DROP INDEX "IDX_usuarios_tenant_email"`);
        
        // Eliminar índices individuales
        await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_tenant_id"`);
        await queryRunner.query(`DROP INDEX "IDX_transacciones_tenant_id"`);
        await queryRunner.query(`DROP INDEX "IDX_anuncios_tenant_id"`);
        await queryRunner.query(`DROP INDEX "IDX_propiedades_tenant_id"`);
        await queryRunner.query(`DROP INDEX "IDX_usuarios_tenant_id"`);
    }
}