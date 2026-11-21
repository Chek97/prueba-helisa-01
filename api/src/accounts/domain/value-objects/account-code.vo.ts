export type AccountLevel = 'CLASE' | 'GRUPO' | 'CUENTA' | 'SUBCUENTA';

const VALID_LENGTHS = new Set([1, 2, 4, 6]);

const LEVEL_BY_LENGTH: Record<number, AccountLevel> = {
  1: 'CLASE',
  2: 'GRUPO',
  4: 'CUENTA',
  6: 'SUBCUENTA',
};

/** Mapa de longitud de código → longitud del prefijo padre */
const PARENT_LENGTH_BY_LENGTH: Record<number, number | null> = {
  1: null, // Clase no tiene padre
  2: 1,    // Grupo → Clase
  4: 2,    // Cuenta → Grupo
  6: 4,    // Subcuenta → Cuenta
};

/**
 * Value Object que representa el código de una cuenta contable.
 *
 * Reglas:
 *  - Solo dígitos numéricos.
 *  - Longitud válida: 1 (Clase), 2 (Grupo), 4 (Cuenta), 6 (Subcuenta).
 *  - El padre se deduce como el prefijo en el nivel inmediato anterior.
 */
export class AccountCode {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(raw: string): AccountCode {
    const trimmed = raw.trim();

    if (!/^\d+$/.test(trimmed)) {
      throw new Error(
        `El código "${raw}" solo debe contener dígitos numéricos.`,
      );
    }

    if (!VALID_LENGTHS.has(trimmed.length)) {
      throw new Error(
        `El código "${raw}" tiene ${trimmed.length} dígito(s). ` +
          `Las longitudes permitidas son: 1 (Clase), 2 (Grupo), 4 (Cuenta), 6 (Subcuenta).`,
      );
    }

    return new AccountCode(trimmed);
  }

  get value(): string {
    return this._value;
  }

  get level(): AccountLevel {
    return LEVEL_BY_LENGTH[this._value.length];
  }

  /**
   * Retorna el código del padre derivado por prefijo, o null si es Clase.
   * Ej: "110505" → "1105" | "1105" → "11" | "11" → "1" | "1" → null
   */
  get parentCode(): string | null {
    const parentLen = PARENT_LENGTH_BY_LENGTH[this._value.length];
    if (parentLen === null) return null;
    return this._value.slice(0, parentLen);
  }

  equals(other: AccountCode): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
