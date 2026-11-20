import type { TASK_PRIORITIES, TASK_STATUSES } from '../constants/task.constants.js';

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Shape persisted in MongoDB (timestamps are managed by Mongoose). */
export interface TaskAttributes {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

/** Public API representation of a task (what clients receive). */
export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}
