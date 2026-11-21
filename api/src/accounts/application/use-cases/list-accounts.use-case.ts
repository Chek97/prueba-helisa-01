import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountLevel } from '../../domain/value-objects/account-code.vo.js';
import * as accountRepository from '../../domain/repositories/account.repository.js';

// ─── Nodo del árbol jerárquico ───────────────────────────────────────────────

export interface AccountTreeNode {
  code: string;
  name: string;
  level: AccountLevel;
  /** Naturaleza heredada de la Clase raíz (DEBITO | CREDITO) */
  nature: string | null;
  parentCode: string | null;
  /** true si no tiene cuentas hijas (admite movimientos contables) */
  isLeaf: boolean;
  children: AccountTreeNode[];
}

export interface ListAccountsQuery {
  /** Si se indica, retorna las hijas directas de ese código */
  parentCode?: string;
  /** Filtro opcional por nivel */
  level?: AccountLevel;
}

/**
 * Caso de uso: Listar cuentas del catálogo.
 *
 * - `execute(query?)` → lista plana con filtros opcionales.
 * - `executeAsTree()` → árbol jerárquico completo con naturaleza heredada.
 */
@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(accountRepository.ACCOUNT_REPOSITORY)
    private readonly accountRepo: accountRepository.AccountRepository,
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

  /**
   * Devuelve el catálogo completo como árbol jerárquico.
   * La naturaleza (DEBITO/CREDITO) se propaga desde la Clase a todos
   * sus descendientes, reflejando la herencia de dominio.
   */
  async executeAsTree(): Promise<AccountTreeNode[]> {
    const accounts = await this.accountRepo.findAll();
    return this.buildTree(accounts);
  }

  // ─── Construcción del árbol ─────────────────────────────────────────────────

  buildTree(accounts: Account[]): AccountTreeNode[] {
    const nodeMap = new Map<string, AccountTreeNode>();

    // Primera pasada: crear todos los nodos
    for (const account of accounts) {
      nodeMap.set(account.code.value, {
        code: account.code.value,
        name: account.name,
        level: account.level,
        nature: account.nature?.value ?? null,
        parentCode: account.parentCode,
        isLeaf: true,
        children: [],
      });
    }

    const roots: AccountTreeNode[] = [];

    // Segunda pasada: conectar padre → hijo
    for (const account of accounts) {
      const node = nodeMap.get(account.code.value)!;
      const parentCode = account.parentCode;

      if (parentCode && nodeMap.has(parentCode)) {
        const parent = nodeMap.get(parentCode)!;
        parent.children.push(node);
        parent.isLeaf = false;
      } else {
        roots.push(node);
      }
    }

    // Propagar naturaleza desde las Clases hacia todos sus descendientes
    this.propagateNature(roots, null);

    return roots;
  }

  private propagateNature(
    nodes: AccountTreeNode[],
    inheritedNature: string | null,
  ): void {
    for (const node of nodes) {
      if (!node.nature) {
        node.nature = inheritedNature;
      }
      this.propagateNature(node.children, node.nature);
    }
  }
}
