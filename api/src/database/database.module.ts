import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { AccountTypeOrmEntity } from '../accounts/infrastructure/persistence/typeorm/account.typeorm-entity.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'db', 'helisa.sqlite');

/**
 * Módulo de base de datos.
 *
 * Configura TypeORM con el driver better-sqlite3.
 * `synchronize: true` crea/actualiza el esquema automáticamente.
 * En producción se recomienda usar migraciones y deshabilitar synchronize.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: DB_PATH,
      entities: [AccountTypeOrmEntity],
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
    }),
  ],
})
export class DatabaseModule {}
