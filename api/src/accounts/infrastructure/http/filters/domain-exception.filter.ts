import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../../../domain/errors/account.errors.js';

/** Mapeo de código semántico de dominio → HTTP status */
const HTTP_STATUS_MAP: Record<string, number> = {
  PARENT_NOT_FOUND: HttpStatus.UNPROCESSABLE_ENTITY,         // 422
  ACCOUNT_HAS_CHILDREN: HttpStatus.CONFLICT,                 // 409
  ACCOUNT_NOT_FOUND: HttpStatus.NOT_FOUND,                   // 404
  CODE_ALREADY_EXISTS: HttpStatus.CONFLICT,                  // 409
  CLASS_MUST_HAVE_NATURE: HttpStatus.BAD_REQUEST,            // 400
  NON_CLASS_MUST_NOT_HAVE_NATURE: HttpStatus.BAD_REQUEST,    // 400
  NAME_MUST_NOT_BE_EMPTY: HttpStatus.BAD_REQUEST,            // 400
  ACCOUNT_IS_NOT_LEAF: HttpStatus.UNPROCESSABLE_ENTITY,      // 422
  INVALID_CODE_FORMAT: HttpStatus.BAD_REQUEST,               // 400
  INVALID_NATURE: HttpStatus.BAD_REQUEST,                    // 400
};

/**
 * Filtro global que captura `DomainError` y los transforma en respuestas
 * HTTP estructuradas con el campo `success: false`.
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HTTP_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;

    this.logger.warn(`[${exception.code}] ${exception.message}`);

    response.status(status).json({
      success: false,
      error: exception.code,
      message: exception.message,
    });
  }
}
