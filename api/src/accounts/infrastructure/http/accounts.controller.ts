import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case.js';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case.js';
import { GetAccountUseCase } from '../../application/use-cases/get-account.use-case.js';
import { ListAccountsUseCase } from '../../application/use-cases/list-accounts.use-case.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { DomainExceptionFilter } from './filters/domain-exception.filter.js';
import { AccountMapper } from './mappers/account.mapper.js';

@Controller('accounts')
@UseFilters(DomainExceptionFilter)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
  ) {}

  /**
   * GET /accounts
   *
   * Devuelve el catálogo completo de cuentas como árbol jerárquico.
   * Cada nodo incluye sus hijos directos y la naturaleza heredada
   * desde la Clase raíz (DEBITO | CREDITO).
   *
   * Respuesta exitosa:
   * {
   *   "success": true,
   *   "message": "Se encontraron N cuentas en el catálogo",
   *   "data": [ { ...Clase, children: [ { ...Grupo, children: [...] } ] } ]
   * }
   */
  @Get()
  async findAll() {
    const tree = await this.listAccountsUseCase.executeAsTree();
    const totalAccounts = this.countNodes(tree);

    return {
      success: true,
      message:
        totalAccounts === 0
          ? 'El catálogo de cuentas está vacío'
          : `Se encontraron ${totalAccounts} cuenta(s) en el catálogo`,
      data: tree,
    };
  }

  /**
   * GET /accounts/:code
   *
   * Obtiene una cuenta individual por su código exacto.
   */
  @Get(':code')
  async findOne(@Param('code') code: string) {
    const account = await this.getAccountUseCase.execute(code);
    return {
      success: true,
      message: `Cuenta "${code}" encontrada`,
      data: AccountMapper.toResponse(account),
    };
  }

  /**
   * POST /accounts
   *
   * Crea una nueva cuenta contable.
   *
   * Validaciones:
   *  - El código debe ser numérico y tener longitud 1, 2, 4 o 6.
   *  - El código debe ser único en el catálogo.
   *  - Si no es Clase, su cuenta padre debe existir.
   *  - Las Clases deben indicar naturaleza (DEBITO | CREDITO).
   *
   * Body: { "code": "11", "name": "Disponible", "nature"?: "DEBITO" }
   *
   * Respuesta exitosa (201):
   * { "success": true, "message": "...", "data": { ... } }
   *
   * Respuesta de error (400 | 409 | 422):
   * { "success": false, "error": "CODE_ALREADY_EXISTS", "message": "..." }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAccountDto) {
    const account = await this.createAccountUseCase.execute(dto);
    const levelLabel: Record<string, string> = {
      CLASE: 'Clase',
      GRUPO: 'Grupo',
      CUENTA: 'Cuenta',
      SUBCUENTA: 'Subcuenta',
    };

    return {
      success: true,
      message: `${levelLabel[account.level]} "${account.code.value} - ${account.name}" creada exitosamente`,
      data: AccountMapper.toResponse(account),
    };
  }

  /**
   * DELETE /accounts/:code
   *
   * Elimina una cuenta solo si no tiene cuentas hijas.
   *
   * Respuesta exitosa (200):
   * { "success": true, "message": "Cuenta \"1105\" eliminada correctamente" }
   *
   * Respuesta de error (404 | 409):
   * { "success": false, "error": "ACCOUNT_HAS_CHILDREN", "message": "..." }
   */
  @Delete(':code')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('code') code: string) {
    await this.deleteAccountUseCase.execute(code);
    return {
      success: true,
      message: `Cuenta "${code}" eliminada correctamente`,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Cuenta recursivamente todos los nodos del árbol */
  private countNodes(
    nodes: { children: { children: unknown[] }[] }[],
  ): number {
    return nodes.reduce(
      (sum, node) => sum + 1 + this.countNodes(node.children as typeof nodes),
      0,
    );
  }
}
