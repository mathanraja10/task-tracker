import { TaskModel } from '../../models/task.model.js';
import type { TaskPriority, TaskStatus } from '../../types/task.types.js';

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export function buildTaskPayload(overrides: Partial<TaskPayload> = {}): TaskPayload {
  return {
    title: 'Fix login redirect bug',
    description: 'Users are redirected to a 404 page after signing in.',
    ...overrides,
  };
}

/** Inserts a task directly via the model (bypasses HTTP) and returns its id. */
export async function seedTask(overrides: Partial<TaskPayload> = {}): Promise<string> {
  const task = await TaskModel.create(buildTaskPayload(overrides));
  return task._id.toString();
}
