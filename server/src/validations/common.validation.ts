import { z } from 'zod';

/**
 * Strict 24-hex-character ObjectId check.
 * (mongoose.isValidObjectId also accepts any 12-byte string, which is too lenient.)
 */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id format');

export function isValidObjectId(value: unknown): value is string {
  return objectIdSchema.safeParse(value).success;
}

/** Treats `?status=` (empty string) the same as an absent query param. */
export function emptyStringToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}
