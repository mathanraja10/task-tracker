import { cn } from '@/lib/cn';

interface SpinnerProps {
  /** When set, the spinner is announced to screen readers; otherwise it is decorative. */
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  const icon = (
    <svg
      className={cn('size-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );

  if (!label) return icon;

  return (
    <span role="status" className="inline-flex items-center gap-2">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
