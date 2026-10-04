import { badRequest } from '../utils/httpError.js';

/** Format Zod issues as `{ field: message }` for field-level error display on the client. */
export const formatZodIssues = (error) => {
  const details = {};
  for (const issue of error.issues || []) {
    const key = issue.path?.length ? issue.path.join('.') : '_';
    if (!details[key]) details[key] = issue.message;
  }
  return details;
};

/**
 * Validate `req.body` against a Zod schema and replace it with the parsed
 * (trimmed/coerced) value. Responds 400 with field details on failure.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = formatZodIssues(result.error);
    const first = Object.values(details)[0] || 'Invalid request data';
    return next(badRequest(first, details));
  }
  req.body = result.data;
  next();
};
