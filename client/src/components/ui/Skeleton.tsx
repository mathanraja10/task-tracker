import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
}

/** Decorative loading placeholder; pair with an accessible loading label. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-slate-200', className)} aria-hidden="true" />
  );
}
