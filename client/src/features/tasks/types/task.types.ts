import type { ApiPage } from '@/types/api';

import type { TASK_PRIORITIES, TASK_STATUSES } from '../constants/task.constants';

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** A task as returned by the API. */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/tasks body. */
export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

/** PATCH /api/tasks/:id body — at least one field is required. */
export type UpdateTaskPayload =
  | { status: TaskStatus; priority?: TaskPriority }
  | { status?: TaskStatus; priority: TaskPriority };

/** GET /api/tasks query; an absent key means "all". */
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  /** Case-insensitive substring match on title or description. */
  q?: string;
}

/** One page of GET /api/tasks. */
export type TaskPage = ApiPage<Task>;

export interface DeleteTaskResult {
  id: string;
}
