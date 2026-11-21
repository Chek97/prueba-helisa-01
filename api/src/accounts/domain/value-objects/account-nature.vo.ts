import { DomainError } from '../errors/account.errors.js';

export type NatureType = 'DEBITO' | 'CREDITO';

/**
 * Value Object que representa la naturaleza contable de una Clase.
 * Solo las Clases la poseen directamente; sus descendientes la heredan.
 *
 * Lanza `DomainError` para que el filtro de excepciones lo mapee
 * automáticamente a una respuesta HTTP estructurada.
 */
export class AccountNature {
  private readonly _value: NatureType;

  private constructor(value: NatureType) {
    this._value = value;
  }

  static create(raw: string): AccountNature {
    const upper = (raw ?? '').trim().toUpperCase();

    if (upper !== 'DEBITO' && upper !== 'CREDITO') {
      throw new DomainError(
        `Naturaleza inválida: "${raw}". Los valores permitidos son DEBITO o CREDITO.`,
        'INVALID_NATURE',
      );
    }

    return new AccountNature(upper as NatureType);
  }

  static debit(): AccountNature {
    return new AccountNature('DEBITO');
  }

  static credit(): AccountNature {
    return new AccountNature('CREDITO');
  }

  get value(): NatureType {
    return this._value;
  }

  equals(other: AccountNature): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
