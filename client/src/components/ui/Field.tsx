import type { ReactNode } from 'react';

interface FieldProps {
  /** id of the control this field labels. */
  htmlFor: string;
  label: string;
  error?: string | undefined;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

/** Label + control + hint/error, wired for screen readers. */
export function Field({ htmlFor, label, error, hint, required = false, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="text-rose-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : (
        hint !== undefined && (
          <p id={`${htmlFor}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
