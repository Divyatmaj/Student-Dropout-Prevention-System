import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError({ status: 404, code: 'ROUTE_NOT_FOUND', message: `No API route for ${req.method} ${req.path}.` }));
}
