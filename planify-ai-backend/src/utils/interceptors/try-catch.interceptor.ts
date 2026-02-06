import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

/**
 * Global try-catch: any error thrown from route handlers that is not already an HttpException
 * is converted to InternalServerErrorException with a generic message.
 * This ensures all errors are handled and the AllExceptionsFilter can format them consistently.
 */
@Injectable()
export class TryCatchInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpException) {
          return throwError(() => err);
        }
        return throwError(
          () => new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER),
        );
      }),
    );
  }
}
