import { apiUrl } from '../../api';
import type {
  AccountTreeNode,
  ApiErrorResponse,
  ApiOkResponse,
  CreateAccountPayload,
} from './accounts.types';

// ── Helper interno ────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<ApiOkResponse<T>> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    const err = body as ApiErrorResponse;
    throw new ApiError(err.message, err.error, res.status);
  }
  return body as ApiOkResponse<T>;
}

/** Error estructurado con el código semántico del backend */
export class ApiError extends Error {
  readonly errorCode: string;
  readonly httpStatus: number;

  constructor(
    message: string,
    errorCode: string,
    httpStatus: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

// ── Servicio de cuentas ───────────────────────────────────────────────────

/**
 * Obtiene el catálogo completo como árbol jerárquico.
 */
export async function fetchAccountTree(): Promise<AccountTreeNode[]> {
  const res = await fetch(apiUrl('/accounts'));
  const body = await handleResponse<AccountTreeNode[]>(res);
  return body.data ?? [];
}

/**
 * Verifica si existe una cuenta con el código dado.
 * Usado para validar el padre antes de crear.
 */
export async function checkAccountExists(code: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/accounts/${encodeURIComponent(code)}`));
    if (res.status === 404) return false;
    const body = await res.json();
    return body.success === true;
  } catch {
    return false;
  }
}

/**
 * Crea una nueva cuenta contable.
 * Lanza `ApiError` si el backend rechaza la operación.
 */
export async function createAccount(
  payload: CreateAccountPayload,
): Promise<AccountTreeNode> {
  const res = await fetch(apiUrl('/accounts'), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const body = await handleResponse<AccountTreeNode>(res);
  return body.data!;
}

/**
 * Elimina una cuenta por código.
 * Lanza `ApiError` si tiene hijas o no existe.
 */
export async function deleteAccount(code: string): Promise<string> {
  const res = await fetch(apiUrl(`/accounts/${encodeURIComponent(code)}`), {
    method: 'DELETE',
  });
  const body = await handleResponse<never>(res);
  return body.message;
}
