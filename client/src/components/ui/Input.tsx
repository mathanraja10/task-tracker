import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

import { formControlClasses } from './form-control';

interface InputProps extends ComponentPropsWithRef<'input'> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(formControlClasses, 'h-10 px-3', className)}
      {...props}
    />
  );
}
