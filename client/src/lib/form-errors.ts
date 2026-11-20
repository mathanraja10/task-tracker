import type { ValidationIssue } from '@/types/api';

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export interface MappedFormErrors<TField extends string> {
  fieldErrors: FieldErrors<TField>;
  /** Issues that don't belong to a known field (e.g. "Unrecognized key"). */
  formError?: string;
}

/**
 * Splits validation issues (from the server's 400 response or a client-side
 * Zod parse) into per-field messages, keeping the first message per field.
 */
export function mapValidationIssues<TField extends string>(
  issues: readonly ValidationIssue[],
  fields: readonly TField[],
): MappedFormErrors<TField> {
  const isKnownField = (field: string): field is TField =>
    (fields as readonly string[]).includes(field);

  const fieldErrors: FieldErrors<TField> = {};
  const unmatched: string[] = [];

  for (const issue of issues) {
    if (isKnownField(issue.field)) {
      fieldErrors[issue.field] ??= issue.message;
    } else {
      unmatched.push(issue.message);
    }
  }

  return unmatched.length > 0 ? { fieldErrors, formError: unmatched.join(' ') } : { fieldErrors };
}
