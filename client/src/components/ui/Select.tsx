import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/cn';

import { formControlClasses } from './form-control';

export interface SelectOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface SelectProps<TValue extends string> extends ComponentPropsWithRef<'select'> {
  options: readonly SelectOption<TValue>[];
  /** Adds a leading option with an empty value (e.g. "All statuses"). */
  placeholderOption?: string;
  invalid?: boolean;
  selectSize?: 'sm' | 'md';
}

export function Select<TValue extends string>({
  options,
  placeholderOption,
  invalid = false,
  selectSize = 'md',
  className,
  ...props
}: SelectProps<TValue>) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        formControlClasses,
        'cursor-pointer pr-8 pl-3',
        selectSize === 'sm' ? 'h-8 text-xs' : 'h-10',
        className,
      )}
      {...props}
    >
      {placeholderOption !== undefined && <option value="">{placeholderOption}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
