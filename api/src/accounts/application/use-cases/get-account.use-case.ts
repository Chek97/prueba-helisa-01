import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountErrors } from '../../domain/errors/account.errors.js';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../domain/repositories/account.repository.js';

/**
 * Caso de uso: Obtener una cuenta por código.
 */
@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepository,
  ) {}

  async execute(code: string): Promise<Account> {
    const account = await this.accountRepo.findByCode(code);
    if (!account) {
      throw AccountErrors.accountNotFound(code);
    }
    return account;
  }
}
