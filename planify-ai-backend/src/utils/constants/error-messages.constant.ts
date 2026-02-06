/**
 * Generic error messages for all modules (Auth, User, Address, and any future tables).
 * Use these keys everywhere so naming stays consistent and reusable.
 */

export const ERROR_MESSAGES = {
  // HTTP / Generic
  INTERNAL_SERVER: 'Something went wrong. Please try again later.',
  INTERNAL_SERVER_LABEL: 'Internal Server Error',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  NOT_FOUND_OR_DELETED: 'Resource not found or has been deleted',

  // Common validation (reusable by any module)
  ALREADY_EXISTS: 'Email or mobile number already exists',
  REQUIRED_FIRSTNAME: 'firstName is required',
  REQUIRED_LASTNAME: 'lastName is required',
  REQUIRED_EMAIL: 'email is required',
  REQUIRED_MOBILE: 'mobile is required',
  CONTACT_REQUIRED: 'Email or mobile number (contact) is required',
  OTP_REQUIRED: 'OTP is required',
  OTP_INVALID_EXPIRED: 'Invalid or expired OTP',
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
  PROFILE_UPLOAD_NOT_CONFIGURED: 'Profile upload is not configured. Try without profile image.',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token',
  STATUS_INVALID: 'Invalid status. Use Active or Inactive',
  DELETED_SUCCESS: 'Deleted successfully',

  // File / Multer (reusable for any upload)
  FILE_FIELD_INVALID:
    'Invalid file field. Use form-data with fields: firstName, lastName, email, mobile, gender (Male/Female/Other), address, country, state, pincode. Profile image: field "profile" or "image" or "file". Max 5MB.',
  FILE_TOO_LARGE: 'File too large. Maximum size is 5MB.',
  FILE_IMAGE_ONLY: 'Only image files are allowed for profile.',

  // Database (reusable for any entity)
  DB_CONSTRAINT_VIOLATION: 'Invalid data. Please check your input.',
} as const;
