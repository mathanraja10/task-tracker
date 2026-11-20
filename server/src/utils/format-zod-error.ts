import type { ZodError } from 'zod';

import type { ValidationIssue } from '../types/api.types.js';

/** Flattens a ZodError into `{ field, message }` pairs for API consumers. */
export function formatZodError(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.map(String).join('.') : 'body',
    message: issue.message,
  }));
}
