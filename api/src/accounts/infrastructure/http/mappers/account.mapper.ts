import { Account } from '../../../domain/entities/account.entity.js';
import { AccountResponseDto } from '../dto/account-response.dto.js';

/**
 * Mapper entre la entidad de dominio `Account` y el DTO de respuesta HTTP.
 *
 * Encapsula la transformación para que el controlador no dependa
 * directamente de la estructura interna del dominio.
 */
export class AccountMapper {
  static toResponse(
    account: Account,
    options?: {
      hasChildren?: boolean;
      /** Naturaleza heredada de la Clase raíz (para cuentas no-Clase) */
      rootNature?: string | null;
    },
  ): AccountResponseDto {
    const nature =
      account.nature?.value ??
      options?.rootNature ??
      null;

    return {
      code: account.code.value,
      name: account.name,
      level: account.level,
      nature,
      parentCode: account.parentCode,
      isLeaf:
        options?.hasChildren !== undefined
          ? !options.hasChildren
          : undefined,
    };
  }

  static toResponseList(accounts: Account[]): AccountResponseDto[] {
    return accounts.map((a) => AccountMapper.toResponse(a));
  }
}
