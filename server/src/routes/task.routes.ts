import { Router } from 'express';

import * as taskController from '../controllers/task.controller.js';
import { validate, validateObjectId } from '../middlewares/validate.middleware.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../validations/task.validation.js';

export const taskRouter = Router();

taskRouter
  .route('/')
  .get(validate({ query: listTasksQuerySchema }), taskController.listTasks)
  .post(validate({ body: createTaskSchema }), taskController.createTask);

taskRouter
  .route('/:id')
  .all(validateObjectId('id', 'Task'))
  .patch(validate({ body: updateTaskSchema }), taskController.updateTask)
  .delete(taskController.deleteTask);
