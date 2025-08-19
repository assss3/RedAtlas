import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIndexes1700000000002 implements MigrationInterface {
    name = 'AddTenantIndexes1700000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Extensiones necesarias
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
        
        // Índices básicos multi-tenant
        await queryRunner.query(`CREATE INDEX "IDX_usuarios_tenant_email" ON "usuarios" ("tenant_id", "email")`);
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_tenant_status" ON "propiedades" ("tenant_id", "status") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_tenant_ciudad_tipo" ON "propiedades" ("tenant_id", "ciudad", "tipo") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_tenant_status" ON "anuncios" ("tenant_id", "status") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_tenant_property" ON "anuncios" ("tenant_id", "property_id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_tenant_price" ON "anuncios" ("tenant_id", "price" DESC) WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_transacciones_tenant_status" ON "transacciones" ("tenant_id", "status") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_transacciones_tenant_user" ON "transacciones" ("tenant_id", "user_id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_transacciones_tenant_anuncio" ON "transacciones" ("tenant_id", "anuncio_id") WHERE "deleted_at" IS NULL`);
        
        // Índices espaciales PostGIS
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_location_gist" ON "propiedades" USING GIST ("location") WHERE "deleted_at" IS NULL`);
        
        // Índices de texto completo
        await queryRunner.query(`CREATE INDEX "IDX_propiedades_title_gin" ON "propiedades" USING GIN (to_tsvector('spanish', "title")) WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_anuncios_description_gin" ON "anuncios" USING GIN (to_tsvector('spanish', "description")) WHERE "deleted_at" IS NULL`);
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