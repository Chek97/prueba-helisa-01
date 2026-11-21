/**
 * Error base del dominio contable.
 * Lleva un `code` semántico para que las capas externas puedan mapear
 * el error a una respuesta HTTP apropiada sin conocer el dominio.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
    // Mantener stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}

/** Fábrica de errores del dominio de cuentas contables */
export class AccountErrors {
  static parentNotFound(parentCode: string): DomainError {
    return new DomainError(
      `El padre con código "${parentCode}" no existe. No se puede crear la cuenta.`,
      'PARENT_NOT_FOUND',
    );
  }

  static accountHasChildren(code: string): DomainError {
    return new DomainError(
      `La cuenta "${code}" tiene cuentas hijas y no puede ser eliminada.`,
      'ACCOUNT_HAS_CHILDREN',
    );
  }

  static accountNotFound(code: string): DomainError {
    return new DomainError(
      `La cuenta con código "${code}" no existe.`,
      'ACCOUNT_NOT_FOUND',
    );
  }

  static codeAlreadyExists(code: string): DomainError {
    return new DomainError(
      `Ya existe una cuenta con el código "${code}".`,
      'CODE_ALREADY_EXISTS',
    );
  }

  static classMustHaveNature(): DomainError {
    return new DomainError(
      'Las cuentas de tipo Clase deben especificar una naturaleza (DEBITO o CREDITO).',
      'CLASS_MUST_HAVE_NATURE',
    );
  }

  static nonClassMustNotHaveNature(): DomainError {
    return new DomainError(
      'Solo las cuentas de tipo Clase pueden especificar una naturaleza directamente. Las demás la heredan de su Clase.',
      'NON_CLASS_MUST_NOT_HAVE_NATURE',
    );
  }

  static nameMustNotBeEmpty(): DomainError {
    return new DomainError(
      'El nombre de la cuenta no puede estar vacío.',
      'NAME_MUST_NOT_BE_EMPTY',
    );
  }

  static accountIsNotLeaf(code: string): DomainError {
    return new DomainError(
      `La cuenta "${code}" tiene hijas y no admite movimientos contables directos.`,
      'ACCOUNT_IS_NOT_LEAF',
    );
  }

  static invalidCodeFormat(raw: string): DomainError {
    return new DomainError(
      `El código "${raw}" no tiene un formato válido. Use 1, 2, 4 o 6 dígitos numéricos.`,
      'INVALID_CODE_FORMAT',
    );
  }
}
