import { z } from 'zod';

import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  TASK_LIMITS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../constants/task.constants.js';
import { emptyStringToUndefined } from './common.validation.js';

const statusSchema = z.enum(TASK_STATUSES, {
  error: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
});

const prioritySchema = z.enum(TASK_PRIORITIES, {
  error: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
});

const titleSchema = z
  .string({
    error: (issue) => (issue.input === undefined ? 'Title is required' : 'Title must be a string'),
  })
  .trim()
  .min(TASK_LIMITS.TITLE_MIN, `Title must be at least ${TASK_LIMITS.TITLE_MIN} characters`)
  .max(TASK_LIMITS.TITLE_MAX, `Title must be at most ${TASK_LIMITS.TITLE_MAX} characters`);

const descriptionSchema = z
  .string({ error: 'Description must be a string' })
  .trim()
  .max(
    TASK_LIMITS.DESCRIPTION_MAX,
    `Description must be at most ${TASK_LIMITS.DESCRIPTION_MAX} characters`,
  );

/** POST /api/tasks */
export const createTaskSchema = z.strictObject(
  {
    title: titleSchema,
    description: descriptionSchema.optional(),
    status: statusSchema.default(DEFAULT_TASK_STATUS),
    priority: prioritySchema.default(DEFAULT_TASK_PRIORITY),
  },
  { error: 'Request body must be a JSON object' },
);

/** PATCH /api/tasks/:id — only status and/or priority may change. */
export const updateTaskSchema = z
  .strictObject(
    {
      status: statusSchema.optional(),
      priority: prioritySchema.optional(),
    },
    { error: 'Request body must be a JSON object' },
  )
  .refine((data) => data.status !== undefined || data.priority !== undefined, {
    error: 'Provide at least one field to update: status or priority',
  });

/** GET /api/tasks?status=&priority= */
export const listTasksQuerySchema = z.object({
  status: z.preprocess(emptyStringToUndefined, statusSchema.optional()),
  priority: z.preprocess(emptyStringToUndefined, prioritySchema.optional()),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
