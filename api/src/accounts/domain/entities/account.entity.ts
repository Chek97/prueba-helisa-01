import { AccountCode, AccountLevel } from '../value-objects/account-code.vo.js';
import { AccountNature } from '../value-objects/account-nature.vo.js';
import { AccountErrors } from '../errors/account.errors.js';

export interface AccountProps {
  code: string;
  name: string;
  /** Obligatorio solo para cuentas de tipo Clase */
  nature?: string;
}

export interface AccountReconstitution {
  code: string;
  name: string;
  /** Valor de naturaleza guardado en BD (solo Clases la tienen persistida) */
  nature: string | null;
}

/**
 * Entidad raíz del dominio: Cuenta Contable.
 *
 * Invariantes garantizadas:
 *  - El código cumple la longitud permitida (1, 2, 4 o 6 dígitos).
 *  - Las cuentas de tipo Clase deben tener naturaleza asignada.
 *  - Las demás cuentas no persisten la naturaleza (la heredan de su Clase).
 *  - El nombre no puede estar vacío.
 */
export class Account {
  private readonly _code: AccountCode;
  private _name: string;
  /**
   * Solo las Clases almacenan la naturaleza de forma directa.
   * Los descendientes la heredan consultando su raíz en el repositorio.
   */
  private readonly _nature: AccountNature | null;

  private constructor(
    code: AccountCode,
    name: string,
    nature: AccountNature | null,
  ) {
    this._code = code;
    this._name = name;
    this._nature = nature;
  }

  // ─── Factory: construcción desde la capa de aplicación ─────────────────────

  static create(props: AccountProps): Account {
    const code = AccountCode.create(props.code);

    if (!props.name || props.name.trim() === '') {
      throw AccountErrors.nameMustNotBeEmpty();
    }

    let nature: AccountNature | null = null;

    if (code.level === 'CLASE') {
      if (!props.nature) {
        throw AccountErrors.classMustHaveNature();
      }
      nature = AccountNature.create(props.nature);
    } else {
      if (props.nature) {
        throw AccountErrors.nonClassMustNotHaveNature();
      }
    }

    return new Account(code, props.name.trim(), nature);
  }

  // ─── Factory: reconstitución desde persistencia ─────────────────────────────

  static reconstitute(data: AccountReconstitution): Account {
    const code = AccountCode.create(data.code);
    const nature = data.nature ? AccountNature.create(data.nature) : null;
    return new Account(code, data.name, nature);
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get code(): AccountCode {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get nature(): AccountNature | null {
    return this._nature;
  }

  get level(): AccountLevel {
    return this._code.level;
  }

  /**
   * Código del padre derivado por prefijo.
   * Retorna null si la cuenta es de tipo Clase.
   */
  get parentCode(): string | null {
    return this._code.parentCode;
  }

  // ─── Consultas de dominio ───────────────────────────────────────────────────

  isClass(): boolean {
    return this.level === 'CLASE';
  }

  /**
   * Una cuenta es hoja (leaf) cuando no tiene cuentas hijas.
   * Solo las cuentas hoja admiten movimientos contables.
   * @param hasChildren valor provisto por el repositorio
   */
  isLeaf(hasChildren: boolean): boolean {
    return !hasChildren;
  }
}
