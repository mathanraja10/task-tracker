import type { RequestHandler } from 'express';

import { NotFoundError } from '../utils/app-error.js';

/** Catch-all for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
