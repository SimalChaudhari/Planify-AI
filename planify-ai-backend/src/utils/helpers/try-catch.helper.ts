import {
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

type ErrorMessage = string | (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];

/**
 * Wraps async code in try-catch. Rethrows HttpException as-is; converts other errors to InternalServerErrorException.
 * Use in services or controllers to easily handle errors with a consistent response.
 *
 * @example
 * return handleAsync(() => this.someRiskyOperation(), ERROR_MESSAGES.INTERNAL_SERVER);
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  errorMessage?: ErrorMessage,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpException) throw e;
    const message = errorMessage ?? ERROR_MESSAGES.INTERNAL_SERVER;
    throw new InternalServerErrorException(message);
  }
}

/**
 * Same as handleAsync but with optional status (default 500). Use for custom status like 400.
 */
export async function handleAsyncWithStatus<T>(
  fn: () => Promise<T>,
  options?: { message?: ErrorMessage; status?: HttpStatus },
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpException) throw e;
    const message = options?.message ?? ERROR_MESSAGES.INTERNAL_SERVER;
    const status = options?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    if (status === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(message);
    }
    throw new InternalServerErrorException(message);
  }
}
