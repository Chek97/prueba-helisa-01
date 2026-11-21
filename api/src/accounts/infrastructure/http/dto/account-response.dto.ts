/** Representación de una cuenta contable expuesta por la API */
export class AccountResponseDto {
  /** Código único (1, 2, 4 o 6 dígitos) */
  code: string;

  /** Nombre descriptivo */
  name: string;

  /** Nivel jerárquico: CLASE | GRUPO | CUENTA | SUBCUENTA */
  level: string;

  /**
   * Naturaleza heredada de la Clase raíz: DEBITO | CREDITO.
   * Se incluye en la respuesta para todos los niveles,
   * aunque en BD solo las Clases la persisten.
   */
  nature: string | null;

  /** Código del padre directo. null para las Clases. */
  parentCode: string | null;

  /**
   * true si la cuenta no tiene hijas (admite movimientos).
   * Solo se incluye cuando el contexto lo conoce.
   */
  isLeaf?: boolean;
}
