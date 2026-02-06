/**
 * Standard error response shape for all APIs (Auth, User, Address, etc.)
 */

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  timestamp?: string;
}

export function formatErrorResponse(
  message: string,
  error: string,
  statusCode: number,
): ErrorResponse {
  return {
    success: false,
    message,
    error,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}
