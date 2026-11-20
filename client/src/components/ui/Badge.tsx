import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

interface BadgeProps {
  tone?: BadgeTone;
  /** Shows a colored dot before the label. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const toneClasses: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-slate-100 text-slate-700 ring-slate-500/20', dot: 'bg-slate-400' },
  info: { badge: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  warning: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/25', dot: 'bg-amber-500' },
  success: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  danger: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
};

export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  const classes = toneClasses[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        classes.badge,
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', classes.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
