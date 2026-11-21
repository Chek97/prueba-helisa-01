import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountErrors } from '../../domain/errors/account.errors.js';
import * as accountRepository from '../../domain/repositories/account.repository.js';

/**
 * Caso de uso: Obtener una cuenta por código.
 */
@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.AccountRepository,
  ) {}

  async execute(code: string): Promise<Account> {
    const account = await this.accountRepo.findByCode(code);
    if (!account) {
      throw AccountErrors.accountNotFound(code);
    }
    return account;
  }
}
