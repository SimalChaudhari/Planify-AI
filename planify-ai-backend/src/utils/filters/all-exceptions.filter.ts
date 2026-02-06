import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { formatErrorResponse, ErrorResponse } from '../interfaces/error-response.interface';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode: number;
    let message: string;
    let error: string;

    // Nest HttpException (BadRequest, NotFound, Unauthorized, etc.)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      error = this.getErrorLabel(statusCode);
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : this.extractMessage(res);
    }
    // TypeORM QueryFailedError (DB constraint, null violation, etc.)
    else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = ERROR_MESSAGES.BAD_REQUEST;
      message = this.getDbErrorMessage(exception);
    }
    // Multer / file upload errors
    else if (exception instanceof Error) {
      const code = (exception as any).code;
      const msg = exception.message || '';

      if (code === 'LIMIT_UNEXPECTED_FILE' || msg.includes('Unexpected field')) {
        statusCode = HttpStatus.BAD_REQUEST;
        error = ERROR_MESSAGES.BAD_REQUEST;
        message = ERROR_MESSAGES.FILE_FIELD_INVALID;
      } else if (code === 'LIMIT_FILE_SIZE') {
        statusCode = HttpStatus.BAD_REQUEST;
        error = ERROR_MESSAGES.BAD_REQUEST;
        message = ERROR_MESSAGES.FILE_TOO_LARGE;
      } else if (msg.includes('Only image files')) {
        statusCode = HttpStatus.BAD_REQUEST;
        error = ERROR_MESSAGES.BAD_REQUEST;
        message = ERROR_MESSAGES.FILE_IMAGE_ONLY;
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        error = ERROR_MESSAGES.INTERNAL_SERVER_LABEL;
        message = ERROR_MESSAGES.INTERNAL_SERVER;
        this.logger.error(
          `${request.method} ${request.url} - ${exception instanceof Error ? exception.message : 'Unknown error'}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = ERROR_MESSAGES.INTERNAL_SERVER_LABEL;
      message = ERROR_MESSAGES.INTERNAL_SERVER;
      this.logger.error('Unhandled exception', String(exception));
    }

    const body: ErrorResponse = formatErrorResponse(message, error, statusCode);
    response.status(statusCode).json(body);
  }

  private getErrorLabel(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_MESSAGES.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_MESSAGES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND;
      default:
        return ERROR_MESSAGES.BAD_REQUEST;
    }
  }

  private extractMessage(res: object): string {
    const obj = res as { message?: string | string[] };
    if (!obj.message) return ERROR_MESSAGES.INTERNAL_SERVER;
    if (Array.isArray(obj.message)) {
      return obj.message
        .map((m) => (typeof m === 'string' && m.toLowerCase().includes('should not be empty') ? 'Required field is missing' : m))
        .join(', ');
    }
    return String(obj.message);
  }

  private getDbErrorMessage(exception: QueryFailedError): string {
    const msg = (exception as any).message || '';
    const detail = (exception as any).driverError?.detail || '';
    if (msg.includes('null value') || detail.includes('null value')) {
      return ERROR_MESSAGES.DB_CONSTRAINT_VIOLATION + ' Some required fields may be missing.';
    }
    if (msg.includes('unique') || msg.includes('duplicate') || detail.includes('unique')) {
      return 'This value is already in use.';
    }
    return ERROR_MESSAGES.DB_CONSTRAINT_VIOLATION;
  }
}
