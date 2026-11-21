import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

/**
 * Entidad de TypeORM para la tabla `accounts`.
 *
 * Esta clase pertenece a la capa de Infraestructura y NO debe importarse
 * desde el Dominio ni desde la capa de Aplicación. El mapeo entre esta
 * clase y la entidad de dominio `Account` lo realiza el repositorio.
 *
 * Esquema:
 *   code        TEXT PK  — código contable único (1, 2, 4 o 6 dígitos)
 *   name        TEXT     — nombre descriptivo de la cuenta
 *   level       TEXT     — CLASE | GRUPO | CUENTA | SUBCUENTA
 *   nature      TEXT?    — DEBITO | CREDITO (solo para Clases; NULL en el resto)
 *   parent_code TEXT?    — FK auto-referencial; NULL para Clases
 */
@Entity('accounts')
export class AccountTypeOrmEntity {
  @PrimaryColumn({ type: 'text' })
  code: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  level: string;

  @Column({ type: 'text', nullable: true })
  nature: string | null;

  @Column({ type: 'text', nullable: true, name: 'parent_code' })
  parentCode: string | null;

  // ─── Relaciones auto-referenciales ────────────────────────────────────────

  @ManyToOne(
    () => AccountTypeOrmEntity,
    (account) => account.children,
    { nullable: true, onDelete: 'RESTRICT' },
  )
  parent: AccountTypeOrmEntity | null;

  @OneToMany(
    () => AccountTypeOrmEntity,
    (account) => account.parent,
  )
  children: AccountTypeOrmEntity[];
}
