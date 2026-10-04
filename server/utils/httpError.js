/**
 * An error with an HTTP status code. Throw it from controllers/services and the
 * central error handler turns it into a JSON response: `{ message, details? }`.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    if (details !== undefined) this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const unauthorized = (message = 'Not authorized') => new HttpError(401, message);
export const notFound = (message = 'Not found') => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);
export const unprocessable = (message, details) => new HttpError(422, message, details);
