import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case.js';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case.js';
import { GetAccountUseCase } from './application/use-cases/get-account.use-case.js';
import { ListAccountsUseCase } from './application/use-cases/list-accounts.use-case.js';
import { ACCOUNT_REPOSITORY } from './domain/repositories/account.repository.js';
import { AccountsController } from './infrastructure/http/accounts.controller.js';
import { AccountTypeOrmEntity } from './infrastructure/persistence/typeorm/account.typeorm-entity.js';
import { AccountTypeOrmRepository } from './infrastructure/persistence/typeorm/account.typeorm.repository.js';

/**
 * Módulo de Cuentas Contables.
 *
 * Registra el repositorio concreto bajo el token simbólico ACCOUNT_REPOSITORY,
 * garantizando que la capa de Aplicación solo conozca la interfaz de dominio.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AccountTypeOrmEntity])],
  controllers: [AccountsController],
  providers: [
    // ── Adaptador de infraestructura registrado como puerto de dominio ──
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: AccountTypeOrmRepository,
    },
    // ── Casos de uso ────────────────────────────────────────────────────
    CreateAccountUseCase,
    DeleteAccountUseCase,
    GetAccountUseCase,
    ListAccountsUseCase,
  ],
})
export class AccountsModule {}
