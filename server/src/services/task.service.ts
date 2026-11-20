import mongoose, { type QueryFilter, type Types } from 'mongoose';

import { TaskModel } from '../models/task.model.js';
import type { TaskAttributes, TaskResponse } from '../types/task.types.js';
import { NotFoundError } from '../utils/app-error.js';
import { encodeCursor } from '../utils/cursor.js';
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

export interface TaskPage {
  tasks: TaskResponse[];
  /** `null` when this is the last page. */
  nextCursor: string | null;
}

/** Escapes user input so it is matched literally inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Lists tasks newest first, one page at a time.
 *
 * Keyset (cursor) pagination: each page continues strictly after the last
 * item of the previous one in `createdAt DESC, _id DESC` order, so inserts and
 * deletes between requests never cause skipped or duplicated items, and the
 * cost per page stays constant (no `skip`).
 */
export async function listTasks({
  status,
  priority,
  q,
  limit,
  cursor,
}: ListTasksQuery): Promise<TaskPage> {
  const conditions: QueryFilter<TaskAttributes>[] = [];

  if (status) conditions.push({ status });
  if (priority) conditions.push({ priority });

  if (q) {
    // Case-insensitive substring match, so partial words ("logi") find "login".
    const pattern = new RegExp(escapeRegExp(q), 'i');
    conditions.push({ $or: [{ title: pattern }, { description: pattern }] });
  }

  if (cursor) {
    const cursorId = new mongoose.Types.ObjectId(cursor.id);
    conditions.push({
      $or: [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursorId } },
      ],
    });
  }

  // Fetch one extra document to learn whether another page exists.
  const docs = await TaskModel.find(conditions.length > 0 ? { $and: conditions } : {})
    // _id is a tiebreaker for tasks created within the same millisecond.
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<TaskRecord[]>()
    .exec();

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  const last = page.at(-1);

  return {
    tasks: page.map(toTaskResponse),
    nextCursor:
      hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last._id.toString() }) : null,
  };
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
