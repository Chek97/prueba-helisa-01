// ── Tipos del dominio de cuentas contables ────────────────────────────────

export type AccountLevel = 'CLASE' | 'GRUPO' | 'CUENTA' | 'SUBCUENTA';
export type NatureType   = 'DEBITO' | 'CREDITO';

/** Nodo del árbol jerárquico retornado por GET /accounts */
export interface AccountTreeNode {
  code:       string;
  name:       string;
  level:      AccountLevel;
  nature:     NatureType | null;
  parentCode: string | null;
  isLeaf:     boolean;
  children:   AccountTreeNode[];
}

/** Payload para crear una cuenta */
export interface CreateAccountPayload {
  code:    string;
  name:    string;
  nature?: string;
}

/** Respuesta genérica de la API */
export interface ApiOkResponse<T = unknown> {
  success: true;
  message: string;
  data?:   T;
}

export interface ApiErrorResponse {
  success: false;
  error:   string;
  message: string;
}

export type ApiResponse<T = unknown> = ApiOkResponse<T> | ApiErrorResponse;

// ── Reglas de validación (espejo del dominio backend) ─────────────────────

const VALID_LENGTHS = new Set([1, 2, 4, 6]);

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Valida el formato del código en el cliente antes de llamar a la API.
 * Espeja las mismas reglas que `AccountCode.create()` del dominio.
 */
export function validateCodeFormat(code: string): ValidationResult {
  const trimmed = code.trim();

  if (!trimmed) {
    return { valid: false, reason: 'El código no puede estar vacío.' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, reason: 'El código solo debe contener dígitos numéricos.' };
  }
  if (!VALID_LENGTHS.has(trimmed.length)) {
    return {
      valid: false,
      reason: `Longitud inválida (${trimmed.length} dígitos). Use 1 (Clase), 2 (Grupo), 4 (Cuenta) o 6 (Subcuenta).`,
    };
  }

  return { valid: true };
}

/** Deriva el código padre esperado a partir del código ingresado */
export function deriveParentCode(code: string): string | null {
  const trimmed = code.trim();
  switch (trimmed.length) {
    case 1: return null;
    case 2: return trimmed.slice(0, 1);
    case 4: return trimmed.slice(0, 2);
    case 6: return trimmed.slice(0, 4);
    default: return null;
  }
}

/** Etiqueta legible del nivel según la longitud del código */
export function getLevelLabel(code: string): AccountLevel | null {
  switch (code.trim().length) {
    case 1: return 'CLASE';
    case 2: return 'GRUPO';
    case 4: return 'CUENTA';
    case 6: return 'SUBCUENTA';
    default: return null;
  }
}
