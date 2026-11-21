import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountLevel } from '../../domain/value-objects/account-code.vo.js';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '../../domain/repositories/account.repository.js';

export interface ListAccountsQuery {
  /** Si se indica, retorna solo las hijas directas de ese código */
  parentCode?: string;
  /** Filtro opcional por nivel */
  level?: AccountLevel;
}

/**
 * Caso de uso: Listar cuentas del catálogo.
 *
 * Permite filtrar por padre directo o por nivel jerárquico.
 */
@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepository,
  ) {}

  async execute(query?: ListAccountsQuery): Promise<Account[]> {
    if (query?.parentCode) {
      return this.accountRepo.findChildren(query.parentCode);
    }

    const all = await this.accountRepo.findAll();

    if (query?.level) {
      return all.filter((a) => a.level === query.level);
    }

    return all;
  }
}
