import { Router } from 'express';

import { taskRouter } from './task.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
});

apiRouter.use('/tasks', taskRouter);
