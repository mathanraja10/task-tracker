import { z, type ZodType } from 'zod';

import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/task.constants';
import type { DeleteTaskResult, Task } from '../types/task.types';

/** Runtime contract for task objects returned by the API. */
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}) satisfies ZodType<Task>;

export const deleteTaskResultSchema = z.object({
  id: z.string(),
}) satisfies ZodType<DeleteTaskResult>;
