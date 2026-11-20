import type { RequestHandler } from 'express';

import * as taskService from '../services/task.service.js';
import type { ApiPage, ApiSuccess } from '../types/api.types.js';
import type { TaskResponse } from '../types/task.types.js';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from '../validations/task.validation.js';

/**
 * Controllers translate HTTP <-> service calls only.
 * Input arrives already validated by `validate()` / `validateObjectId()`.
 * Express 5 forwards rejected promises to the error handler automatically.
 */

interface TaskIdParams {
  [key: string]: string;
  id: string;
}

type NoParams = Record<string, string>;

export const listTasks: RequestHandler<NoParams, ApiPage<TaskResponse>, unknown, ListTasksQuery> =
  async (req, res) => {
    const { tasks, nextCursor } = await taskService.listTasks(req.query);
    res.status(200).json({ data: tasks, meta: { nextCursor } });
  };

export const createTask: RequestHandler<NoParams, ApiSuccess<TaskResponse>, CreateTaskInput> =
  async (req, res) => {
    const task = await taskService.createTask(req.body);
    res.status(201).location(`${req.baseUrl}/${task.id}`).json({ data: task });
  };

export const updateTask: RequestHandler<TaskIdParams, ApiSuccess<TaskResponse>, UpdateTaskInput> =
  async (req, res) => {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.status(200).json({ data: task });
  };

export const deleteTask: RequestHandler<TaskIdParams, ApiSuccess<{ id: string }>> = async (
  req,
  res,
) => {
  await taskService.deleteTask(req.params.id);
  res.status(200).json({ message: 'Task deleted successfully', data: { id: req.params.id } });
};
