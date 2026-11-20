import { z } from 'zod';

import { TASK_LIMITS, TASK_PRIORITIES } from '../constants/task.constants';

/**
 * Client-side mirror of the server's create schema for instant feedback.
 * The server remains the source of truth; its 400 errors are mapped back
 * onto these same fields.
 */
export const createTaskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .min(TASK_LIMITS.TITLE_MIN, `Title must be at least ${TASK_LIMITS.TITLE_MIN} characters`)
    .max(TASK_LIMITS.TITLE_MAX, `Title must be at most ${TASK_LIMITS.TITLE_MAX} characters`),
  description: z
    .string()
    .trim()
    .max(
      TASK_LIMITS.DESCRIPTION_MAX,
      `Description must be at most ${TASK_LIMITS.DESCRIPTION_MAX} characters`,
    ),
  priority: z.enum(TASK_PRIORITIES),
});

export type CreateTaskFormValues = z.input<typeof createTaskFormSchema>;
export type CreateTaskFormField = keyof CreateTaskFormValues;

export const CREATE_TASK_FORM_FIELDS = [
  'title',
  'description',
  'priority',
] as const satisfies readonly CreateTaskFormField[];
