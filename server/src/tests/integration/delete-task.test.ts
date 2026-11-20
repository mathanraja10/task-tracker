import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { TaskModel } from '../../models/task.model.js';
import { seedTask } from '../factories/task.factory.js';
import { errorBody, successBody } from '../helpers/response.js';

const app = createApp();

describe('DELETE /api/tasks/:id', () => {
  it('deletes the task and returns a confirmation', async () => {
    const id = await seedTask();

    const res = await request(app).delete(`/api/tasks/${id}`);

    expect(res.status).toBe(200);
    expect(successBody<{ id: string }>(res)).toEqual({
      message: 'Task deleted successfully',
      data: { id },
    });
    expect(await TaskModel.exists({ _id: id })).toBeNull();
  });

  it('returns 404 when the task does not exist', async () => {
    const res = await request(app).delete(`/api/tasks/${new Types.ObjectId().toString()}`);

    expect(res.status).toBe(404);
    expect(errorBody(res).error.message).toBe('Task not found');
  });

  it('returns 404 when the id format is invalid', async () => {
    const res = await request(app).delete('/api/tasks/123');

    expect(res.status).toBe(404);
  });
});

describe('Unknown routes', () => {
  it('returns 404 JSON for unmatched routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(errorBody(res).error.message).toBe('Route not found: GET /api/does-not-exist');
  });
});
