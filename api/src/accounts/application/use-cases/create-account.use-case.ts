import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountErrors } from '../../domain/errors/account.errors.js';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../domain/repositories/account.repository.js';

export interface CreateAccountCommand {
  code: string;
  name: string;
  /** Requerido si el código tiene 1 dígito (Clase) */
  nature?: string;
}

/**
 * Caso de uso: Crear una cuenta contable.
 *
 * Reglas de negocio aplicadas:
 *  1. El código debe ser único.
 *  2. Las Clases deben tener naturaleza (lo valida la entidad).
 *  3. Para cuentas no-Clase, el padre debe existir.
 */
@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepository,
  ) {}

  async execute(command: CreateAccountCommand): Promise<Account> {
    // 1. Unicidad del código
    const alreadyExists = await this.accountRepo.existsByCode(command.code);
    if (alreadyExists) {
      throw AccountErrors.codeAlreadyExists(command.code);
    }

    // 2. Construir entidad (valida formato, nivel, naturaleza en Clases)
    const account = Account.create({
      code: command.code,
      name: command.name,
      nature: command.nature,
    });

    // 3. Verificar existencia del padre para cuentas no-Clase
    if (!account.isClass()) {
      const parentCode = account.parentCode!;
      const parentExists = await this.accountRepo.existsByCode(parentCode);
      if (!parentExists) {
        throw AccountErrors.parentNotFound(parentCode);
      }
    }

    await this.accountRepo.save(account);
    return account;
  }
}
