import type { Request, RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { NotFoundError } from '../utils/app-error.js';
import { isValidObjectId } from '../validations/common.validation.js';

type ParamsDictionary = Record<string, string>;
type DefaultQuery = Request['query'];

interface RequestSchemas<TBody, TQuery> {
  body?: ZodType<TBody>;
  query?: ZodType<TQuery>;
}

/**
 * Parses `req.body` / `req.query` with Zod and replaces them with the parsed
 * (trimmed, defaulted, typed) values. A ZodError is thrown on failure and
 * mapped to `400 Bad Request` by the global error handler.
 */
export function validate<TBody = unknown, TQuery = DefaultQuery>(
  schemas: RequestSchemas<TBody, TQuery>,
): RequestHandler<ParamsDictionary, unknown, TBody, TQuery> {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      // Express 5 exposes `req.query` as a getter, so it must be redefined.
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    next();
  };
}

/**
 * Rejects malformed ObjectIds with `404 Not Found` (per spec) before they
 * reach the database layer.
 */
export function validateObjectId(
  paramName: string,
  resourceName = 'Resource',
): RequestHandler<ParamsDictionary> {
  return (req, _res, next) => {
    if (!isValidObjectId(req.params[paramName])) {
      next(new NotFoundError(`${resourceName} not found`));
      return;
    }
    next();
  };
}
