import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { AppError } from '../utils/AppError.js';
import { zodIssuesToDetails } from './validate.js';
import { env } from '../config/env.js';

/** Map known Prisma errors to API errors. Returns null for anything else. */
function fromPrisma(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target : target ? [String(target)] : [];
      return new AppError({
        status: 409,
        code: 'DUPLICATE',
        message: 'A record with these details already exists.',
        details: fields.map((field) => ({ field, message: 'Already in use.' })),
      });
    }
    if (err.code === 'P2025') {
      return new AppError({ status: 404, code: 'NOT_FOUND', message: 'The record was not found.' });
    }
    if (err.code === 'P2003') {
      return new AppError({ status: 409, code: 'RELATED_RECORD', message: 'This change refers to a record that does not exist or is still in use.' });
    }
  }
  if (err instanceof Prisma.PrismaClientInitializationError || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(err?.code)) {
    return new AppError({ status: 503, code: 'DATABASE_UNAVAILABLE', message: 'The database is unavailable right now. Please try again shortly.' });
  }
  return null;
}

/** Turn any thrown error into the standard error envelope. Must be registered last. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = err instanceof AppError ? err : null;

  if (!error && err instanceof ZodError) {
    error = new AppError({ status: 422, code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields.', details: zodIssuesToDetails(err.issues) });
  }
  if (!error && err?.type === 'entity.parse.failed') {
    error = new AppError({ status: 400, code: 'MALFORMED_JSON', message: 'The request body is not valid JSON.' });
  }
  if (!error && err?.type === 'entity.too.large') {
    error = new AppError({ status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large.' });
  }
  if (!error) error = fromPrisma(err);

  if (!error) {
    // Unexpected: log the details server-side only. Request bodies are not
    // logged because they can contain student information.
    console.error(`[udaan-api] ${req.method} ${req.originalUrl} failed:`, err);
    error = new AppError({ status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again.' });
  } else if (error.status >= 500 && !env.isTest) {
    console.error(`[udaan-api] ${req.method} ${req.originalUrl} → ${error.status} ${error.code}`);
  }

  res.status(error.status).json({
    success: false,
    error: { code: error.code, message: error.message, details: error.details ?? [] },
  });
}
