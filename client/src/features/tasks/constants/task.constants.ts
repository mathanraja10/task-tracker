import type { BadgeTone } from '@/components/ui/Badge';
import type { SelectOption } from '@/components/ui/Select';

import type { TaskPriority, TaskStatus } from '../types/task.types';

// Kept in sync with server/src/constants/task.constants.ts
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export const TASK_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
} as const;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  todo: 'neutral',
  in_progress: 'info',
  done: 'success',
};

export const PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

export const STATUS_OPTIONS: readonly SelectOption<TaskStatus>[] = TASK_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export const PRIORITY_OPTIONS: readonly SelectOption<TaskPriority>[] = TASK_PRIORITIES.map(
  (value) => ({ value, label: PRIORITY_LABELS[value] }),
);

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value);
}
