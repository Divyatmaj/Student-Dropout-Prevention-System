/**
 * Validate request parts with Zod schemas.
 *
 *   router.post('/', validate({ body: createStudentSchema }), controller)
 *
 * Parsed (and coerced) values are placed on `req.validated.body|query|params`;
 * the originals are left untouched. Failures become 422 VALIDATION_ERROR with
 * `details: [{ field, message }]`, which the web app shows next to each field.
 */
import { AppError } from '../utils/AppError.js';

export function zodIssuesToDetails(issues = []) {
  return issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : '_',
    message: issue.message,
  }));
}

export function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) validated[part] = result.data;
      else details.push(...zodIssuesToDetails(result.error.issues));
    }
    if (details.length) {
      return next(new AppError({ status: 422, code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields.', details }));
    }
    req.validated = validated;
    return next();
  };
}
