/** Shared base styles for text inputs, textareas and selects. */
export const formControlClasses = [
  'block w-full rounded-lg border-0 bg-white text-sm text-slate-900 shadow-sm',
  'ring-1 ring-inset ring-slate-300 placeholder:text-slate-400',
  'focus:ring-2 focus:ring-inset focus:ring-indigo-600 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
  'aria-invalid:ring-rose-400 aria-invalid:focus:ring-rose-500',
].join(' ');

/** The id a control inside `<Field>` should reference via `aria-describedby`. */
export function fieldDescriptionId(id: string, error: string | undefined): string {
  return error ? `${id}-error` : `${id}-hint`;
}
