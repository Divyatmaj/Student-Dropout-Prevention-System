/**
 * An error with an HTTP status and a stable code, turned into the standard
 * error envelope by the error handler:
 *   { success: false, error: { code, message, details } }
 * `details` is a list of { field, message } for form-level errors.
 */
export class AppError extends Error {
  constructor({ status = 500, code = 'INTERNAL_ERROR', message = 'Something went wrong.', details = [] } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message = 'The request is not valid.', details = []) =>
  new AppError({ status: 400, code: 'BAD_REQUEST', message, details });

export const unauthorized = (message = 'Please sign in to continue.') =>
  new AppError({ status: 401, code: 'UNAUTHORIZED', message });

export const forbidden = (message = 'You do not have permission to do this.') =>
  new AppError({ status: 403, code: 'FORBIDDEN', message });

export const notFound = (message = 'Not found.', code = 'NOT_FOUND') =>
  new AppError({ status: 404, code, message });

export const conflict = (message, code = 'CONFLICT', details = []) =>
  new AppError({ status: 409, code, message, details });

export const validationError = (details = [], message = 'Please fix the highlighted fields.') =>
  new AppError({ status: 422, code: 'VALIDATION_ERROR', message, details });
