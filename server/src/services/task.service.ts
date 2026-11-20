import type { Types } from 'mongoose';

import { TaskModel } from '../models/task.model.js';
import type { TaskAttributes, TaskResponse } from '../types/task.types.js';
import { NotFoundError } from '../utils/app-error.js';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from '../validations/task.validation.js';

type TaskRecord = TaskAttributes & { _id: Types.ObjectId };

const TASK_NOT_FOUND = 'Task not found';

/** Maps a persisted document to the public API shape. */
function toTaskResponse(task: TaskRecord): TaskResponse {
  return {
    id: task._id.toString(),
    title: task.title,
    ...(task.description !== undefined && { description: task.description }),
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function listTasks(filters: ListTasksQuery): Promise<TaskResponse[]> {
  const query: Partial<Pick<TaskAttributes, 'status' | 'priority'>> = {};
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;

  // _id is a tiebreaker for tasks created within the same millisecond.
  const tasks = await TaskModel.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .lean<TaskRecord[]>()
    .exec();
  return tasks.map(toTaskResponse);
}

export async function createTask(input: CreateTaskInput): Promise<TaskResponse> {
  const task = await TaskModel.create(input);
  return toTaskResponse(task.toObject<TaskRecord>());
}

/** Callers must pass a syntactically valid ObjectId (enforced by route middleware). */
export async function updateTask(id: string, input: UpdateTaskInput): Promise<TaskResponse> {
  const task = await TaskModel.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<TaskRecord>()
    .exec();

  if (!task) throw new NotFoundError(TASK_NOT_FOUND);
  return toTaskResponse(task);
}

export async function deleteTask(id: string): Promise<void> {
  const deleted = await TaskModel.findByIdAndDelete(id).lean<TaskRecord>().exec();
  if (!deleted) throw new NotFoundError(TASK_NOT_FOUND);
}
