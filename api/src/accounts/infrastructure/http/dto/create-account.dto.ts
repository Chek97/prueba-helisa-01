/** Payload esperado en el body de POST /accounts */
export class CreateAccountDto {
  /** Código numérico de 1, 2, 4 o 6 dígitos */
  code: string;

  /** Nombre descriptivo de la cuenta */
  name: string;

  /**
   * Naturaleza contable: DEBITO o CREDITO.
   * Obligatorio solo para cuentas de tipo Clase (1 dígito).
   */
  nature?: string;
}
