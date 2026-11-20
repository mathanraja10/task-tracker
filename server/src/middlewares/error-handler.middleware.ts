import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import type { ApiError, ValidationIssue } from '../types/api.types.js';
import { AppError } from '../utils/app-error.js';
import { formatZodError } from '../utils/format-zod-error.js';

/** Errors raised by body-parser carry an HTTP status and a `type` tag. */
function isBodyParserError(err: unknown): err is Error & { status: number; type: string } {
  return (
    err instanceof Error &&
    'status' in err &&
    typeof err.status === 'number' &&
    'type' in err &&
    typeof err.type === 'string'
  );
}

function sendError(
  res: Parameters<ErrorRequestHandler>[2],
  statusCode: number,
  message: string,
  details?: ValidationIssue[],
): void {
  const body: ApiError = { error: details ? { message, details } : { message } };
  res.status(statusCode).json(body);
}

/**
 * Central error → HTTP response mapper. Must be registered last.
 * Express requires the 4-argument signature to recognise it as an error handler.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof ZodError) {
    sendError(res, 400, 'Validation failed', formatZodError(err));
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.details);
    return;
  }

  // Defense in depth: schema-level validation from Mongoose.
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    sendError(res, 400, 'Validation failed', details);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 404, 'Resource not found');
    return;
  }

  if (isBodyParserError(err)) {
    const message =
      err.type === 'entity.parse.failed' ? 'Malformed JSON in request body' : err.message;
    sendError(res, err.status, message);
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error('[error] Unhandled error:', err);
  }
  sendError(res, 500, 'Internal server error');
};
