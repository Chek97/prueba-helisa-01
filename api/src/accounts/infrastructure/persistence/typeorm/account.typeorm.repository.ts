import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../../domain/entities/account.entity.js';
import { AccountRepository } from '../../../domain/repositories/account.repository.js';
import { AccountTypeOrmEntity } from './account.typeorm-entity.js';

/**
 * Implementación del puerto `AccountRepository` usando TypeORM + SQLite.
 *
 * Esta clase pertenece exclusivamente a la capa de Infraestructura.
 * El dominio solo conoce la interfaz; el módulo NestJS inyecta esta clase
 * bajo el token ACCOUNT_REPOSITORY.
 */
@Injectable()
export class AccountTypeOrmRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountTypeOrmEntity)
    private readonly repo: Repository<AccountTypeOrmEntity>,
  ) {}

  async findByCode(code: string): Promise<Account | null> {
    const entity = await this.repo.findOne({ where: { code } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Account[]> {
    const entities = await this.repo.find({ order: { code: 'ASC' } });
    return entities.map((e) => this.toDomain(e));
  }

  async findChildren(parentCode: string): Promise<Account[]> {
    const entities = await this.repo.find({
      where: { parentCode },
      order: { code: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.repo.existsBy({ code });
  }

  async hasChildren(code: string): Promise<boolean> {
    return this.repo.existsBy({ parentCode: code });
  }

  async save(account: Account): Promise<void> {
    await this.repo.save(this.toEntity(account));
  }

  async delete(code: string): Promise<void> {
    await this.repo.delete({ code });
  }

  /**
   * Busca la naturaleza de la Clase raíz dado cualquier código.
   * Sube por el árbol usando los prefijos hasta encontrar la Clase (1 dígito).
   */
  async findRootNature(code: string): Promise<string | null> {
    // La raíz siempre es el primer dígito del código
    const rootCode = code.charAt(0);
    const root = await this.repo.findOne({
      where: { code: rootCode },
      select: { nature: true },
    });
    return root?.nature ?? null;
  }

  // ─── Mappers privados ───────────────────────────────────────────────────────

  private toDomain(entity: AccountTypeOrmEntity): Account {
    return Account.reconstitute({
      code: entity.code,
      name: entity.name,
      nature: entity.nature,
    });
  }

  private toEntity(account: Account): AccountTypeOrmEntity {
    const entity = new AccountTypeOrmEntity();
    entity.code = account.code.value;
    entity.name = account.name;
    entity.level = account.level;
    entity.nature = account.nature?.value ?? null;
    entity.parentCode = account.parentCode;
    return entity;
  }
}
