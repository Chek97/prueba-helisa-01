import { Inject, Injectable } from '@nestjs/common';
import { AccountErrors } from '../../domain/errors/account.errors.js';
import * as accountRepository from '../../domain/repositories/account.repository.js';

/**
 * Caso de uso: Eliminar una cuenta contable.
 *
 * Reglas de negocio aplicadas:
 *  1. La cuenta debe existir.
 *  2. No puede tener cuentas hijas (solo se eliminan cuentas hoja).
 */
@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.AccountRepository,
  ) {}

  async execute(code: string): Promise<void> {
    // 1. Existencia
    const exists = await this.accountRepo.existsByCode(code);
    if (!exists) {
      throw AccountErrors.accountNotFound(code);
    }

    // 2. Sin hijas
    const hasChildren = await this.accountRepo.hasChildren(code);
    if (hasChildren) {
      throw AccountErrors.accountHasChildren(code);
    }

    await this.accountRepo.delete(code);
  }
}
