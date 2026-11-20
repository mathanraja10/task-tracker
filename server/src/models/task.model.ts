import { Schema, model } from 'mongoose';

import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  TASK_LIMITS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../constants/task.constants.js';
import type { TaskAttributes } from '../types/task.types.js';

/**
 * Mongoose-level constraints mirror the Zod schemas. Zod is the primary
 * gatekeeper at the HTTP boundary; these protect data written by any other path.
 */
const taskSchema = new Schema<TaskAttributes>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [TASK_LIMITS.TITLE_MIN, `Title must be at least ${TASK_LIMITS.TITLE_MIN} characters`],
      maxlength: [TASK_LIMITS.TITLE_MAX, `Title must be at most ${TASK_LIMITS.TITLE_MAX} characters`],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        TASK_LIMITS.DESCRIPTION_MAX,
        `Description must be at most ${TASK_LIMITS.DESCRIPTION_MAX} characters`,
      ],
    },
    status: {
      type: String,
      enum: [...TASK_STATUSES],
      default: DEFAULT_TASK_STATUS,
      required: true,
    },
    priority: {
      type: String,
      enum: [...TASK_PRIORITIES],
      default: DEFAULT_TASK_PRIORITY,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// The list query sorts by `createdAt DESC, _id DESC` and pages with a keyset
// range on the same two fields. Each index serves one filter combination
// without an in-memory sort. Text search (`?q`) is an unanchored regex, so it
// is applied as a filter while one of these indexes is scanned in order.
taskSchema.index({ createdAt: -1, _id: -1 });
taskSchema.index({ status: 1, createdAt: -1, _id: -1 });
taskSchema.index({ priority: 1, createdAt: -1, _id: -1 });
taskSchema.index({ status: 1, priority: 1, createdAt: -1, _id: -1 });

export const TaskModel = model<TaskAttributes>('Task', taskSchema);
