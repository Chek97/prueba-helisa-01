export type NatureType = 'DEBITO' | 'CREDITO';

/**
 * Value Object que representa la naturaleza contable de una Clase.
 * Solo las Clases la poseen directamente; sus descendientes la heredan.
 */
export class AccountNature {
  private readonly _value: NatureType;

  private constructor(value: NatureType) {
    this._value = value;
  }

  static create(raw: string): AccountNature {
    const upper = raw.trim().toUpperCase();

    if (upper !== 'DEBITO' && upper !== 'CREDITO') {
      throw new Error(
        `Naturaleza inválida: "${raw}". Los valores permitidos son DEBITO o CREDITO.`,
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
