import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

import { formControlClasses } from './form-control';

interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ invalid = false, className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(formControlClasses, 'resize-y px-3 py-2', className)}
      {...props}
    />
  );
}
