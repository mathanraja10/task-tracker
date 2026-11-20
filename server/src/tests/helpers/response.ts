import type { Response } from 'supertest';

import type { ApiError, ApiSuccess } from '../../types/api.types.js';

/**
 * Supertest types `body` as `any`; these helpers give tests a typed view
 * without leaking `any` into assertions.
 */
export function successBody<T>(res: Response): ApiSuccess<T> {
  return res.body as ApiSuccess<T>;
}

export function errorBody(res: Response): ApiError {
  return res.body as ApiError;
}
