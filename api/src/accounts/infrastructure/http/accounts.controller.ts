import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case.js';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case.js';
import { GetAccountUseCase } from '../../application/use-cases/get-account.use-case.js';
import { ListAccountsUseCase } from '../../application/use-cases/list-accounts.use-case.js';
import { AccountLevel } from '../../domain/value-objects/account-code.vo.js';
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
   * Lista todas las cuentas. Acepta filtros opcionales:
   *   ?parentCode=11   → hijas directas de "11"
   *   ?level=CLASE     → solo Clases
   */
  @Get()
  async findAll(
    @Query('parentCode') parentCode?: string,
    @Query('level') level?: AccountLevel,
  ) {
    const accounts = await this.listAccountsUseCase.execute({
      parentCode,
      level,
    });
    return AccountMapper.toResponseList(accounts);
  }

  /**
   * GET /accounts/:code
   * Obtiene una cuenta por su código exacto.
   */
  @Get(':code')
  async findOne(@Param('code') code: string) {
    const account = await this.getAccountUseCase.execute(code);
    return AccountMapper.toResponse(account);
  }

  /**
   * POST /accounts
   * Crea una nueva cuenta contable.
   * Body: { code, name, nature? }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAccountDto) {
    const account = await this.createAccountUseCase.execute(dto);
    return AccountMapper.toResponse(account);
  }

  /**
   * DELETE /accounts/:code
   * Elimina una cuenta solo si no tiene hijas.
   */
  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('code') code: string) {
    await this.deleteAccountUseCase.execute(code);
  }
}
