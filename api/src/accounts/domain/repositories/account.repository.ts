import { Account } from '../entities/account.entity.js';

/**
 * Puerto (interfaz) del repositorio de cuentas contables.
 *
 * Esta interfaz vive en el Dominio y NO depende de ningún framework
 * ni tecnología de persistencia. La implementación concreta reside
 * en la capa de Infraestructura.
 */
export interface AccountRepository {
  /** Busca una cuenta por código exacto. Retorna null si no existe. */
  findByCode(code: string): Promise<Account | null>;

  /** Lista todas las cuentas ordenadas por código ascendente. */
  findAll(): Promise<Account[]>;

  /** Lista las cuentas hijas directas de un código padre. */
  findChildren(parentCode: string): Promise<Account[]>;

  /** Verifica si existe una cuenta con ese código. */
  existsByCode(code: string): Promise<boolean>;

  /** Verifica si la cuenta tiene al menos una hija directa. */
  hasChildren(code: string): Promise<boolean>;

  /**
   * Persiste una nueva cuenta.
   * El caso de uso garantiza que no exista previamente.
   */
  save(account: Account): Promise<void>;

  /** Elimina la cuenta. El caso de uso garantiza que no tenga hijas. */
  delete(code: string): Promise<void>;

  /**
   * Busca la naturaleza de la Clase raíz de un código.
   * Útil para propagar la naturaleza heredada en respuestas.
   */
  findRootNature(code: string): Promise<string | null>;
}

/** Token de inyección de dependencias para el repositorio */
export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
