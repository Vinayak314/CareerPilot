import multer from 'multer';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { formatZodIssues } from './validate.js';

/** 404 for unknown API routes. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/**
 * Central error handler. Every error leaves the API as `{ message, details? }`
 * with an appropriate status; stack traces are only logged, never sent.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is too large. The maximum size is 10 MB.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Upload the resume using the "resume" form field.'
          : err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    details = formatZodIssues(err);
    message = Object.values(details)[0] || 'Invalid request data';
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = Object.values(details)[0] || 'Invalid data';
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = field === 'email' ? 'An account with this email already exists.' : `Duplicate ${field}`;
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    // Don't leak internals for unexpected failures in production.
    if (process.env.NODE_ENV === 'production' && !err.expose) message = 'Internal server error';
  }

  const body = { message };
  if (details && typeof details === 'object') body.details = details;
  res.status(status).json(body);
};
