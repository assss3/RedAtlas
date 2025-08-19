import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1700000000000 implements MigrationInterface {
    name = 'CreateInitialTables1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable PostGIS extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create ENUM types
        await queryRunner.query(`CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TYPE "public"."propiedades_tipo_enum" AS ENUM('departamento', 'casa', 'terreno', 'local', 'oficina')`);
        await queryRunner.query(`CREATE TYPE "public"."propiedades_status_enum" AS ENUM('disponible', 'no_disponible')`);
        await queryRunner.query(`CREATE TYPE "public"."anuncios_tipo_enum" AS ENUM('venta', 'alquiler')`);
        await queryRunner.query(`CREATE TYPE "public"."anuncios_status_enum" AS ENUM('activo', 'inactivo', 'reservado')`);
        await queryRunner.query(`CREATE TYPE "public"."transacciones_status_enum" AS ENUM('pendiente', 'completada', 'cancelada')`);

        // Create tenants table
        await queryRunner.query(`CREATE TABLE "tenants" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            CONSTRAINT "UQ_tenants_name" UNIQUE ("name"),
            CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
        )`);

        // Create usuarios table
        await queryRunner.query(`CREATE TABLE "usuarios" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "nombre" character varying NOT NULL,
            "email" character varying NOT NULL,
            "password_hash" character varying NOT NULL,
            "rol" "public"."usuarios_rol_enum" NOT NULL DEFAULT 'USER',
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            CONSTRAINT "UQ_usuarios_email" UNIQUE ("email"),
            CONSTRAINT "PK_usuarios" PRIMARY KEY ("id")
        )`);

        // Create propiedades table
        await queryRunner.query(`CREATE TABLE "propiedades" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "title" character varying NOT NULL,
            "tipo" "public"."propiedades_tipo_enum" NOT NULL,
            "ambientes" integer,
            "superficie" numeric(10,2) NOT NULL,
            "pais" character varying NOT NULL,
            "ciudad" character varying NOT NULL,
            "calle" character varying NOT NULL,
            "altura" character varying NOT NULL,
            "location" geography(Point,4326),
            "status" "public"."propiedades_status_enum" NOT NULL DEFAULT 'disponible',
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            CONSTRAINT "PK_propiedades" PRIMARY KEY ("id")
        )`);

        // Create anuncios table
        await queryRunner.query(`CREATE TABLE "anuncios" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "property_id" uuid NOT NULL,
            "description" text NOT NULL,
            "tipo" "public"."anuncios_tipo_enum" NOT NULL,
            "price" numeric(10,2) NOT NULL,
            "status" "public"."anuncios_status_enum" NOT NULL DEFAULT 'activo',
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            CONSTRAINT "PK_anuncios" PRIMARY KEY ("id")
        )`);

        // Create transacciones table
        await queryRunner.query(`CREATE TABLE "transacciones" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "anuncio_id" uuid NOT NULL,
            "user_id" uuid NOT NULL,
            "amount" numeric(10,2) NOT NULL,
            "status" "public"."transacciones_status_enum" NOT NULL DEFAULT 'pendiente',
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP,
            CONSTRAINT "PK_transacciones" PRIMARY KEY ("id")
        )`);

        // Create refresh_tokens table
        await queryRunner.query(`CREATE TABLE "refresh_tokens" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "tenant_id" character varying NOT NULL,
            "token" character varying NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
        )`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "anuncios" ADD CONSTRAINT "FK_anuncios_property_id" FOREIGN KEY ("property_id") REFERENCES "propiedades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacciones" ADD CONSTRAINT "FK_transacciones_anuncio_id" FOREIGN KEY ("anuncio_id") REFERENCES "anuncios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacciones" ADD CONSTRAINT "FK_transacciones_user_id" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user_id"`);
        await queryRunner.query(`ALTER TABLE "transacciones" DROP CONSTRAINT "FK_transacciones_user_id"`);
        await queryRunner.query(`ALTER TABLE "transacciones" DROP CONSTRAINT "FK_transacciones_anuncio_id"`);
        await queryRunner.query(`ALTER TABLE "anuncios" DROP CONSTRAINT "FK_anuncios_property_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "transacciones"`);
        await queryRunner.query(`DROP TABLE "anuncios"`);
        await queryRunner.query(`DROP TABLE "propiedades"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "tenants"`);

        // Drop ENUM types
        await queryRunner.query(`DROP TYPE "public"."transacciones_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."anuncios_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."anuncios_tipo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."propiedades_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."propiedades_tipo_enum"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
    }
}