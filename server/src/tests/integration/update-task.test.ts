import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { TaskModel } from '../../models/task.model.js';
import type { TaskResponse } from '../../types/task.types.js';
import { seedTask } from '../factories/task.factory.js';
import { errorBody, successBody } from '../helpers/response.js';

const app = createApp();

describe('PATCH /api/tasks/:id', () => {
  it("updates a task's status and returns the updated task", async () => {
    const id = await seedTask();

    const res = await request(app).patch(`/api/tasks/${id}`).send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    const { data } = successBody<TaskResponse>(res);
    expect(data.id).toBe(id);
    expect(data.status).toBe('in_progress');
    expect(data.priority).toBe('medium');

    const saved = await TaskModel.findById(id).lean();
    expect(saved?.status).toBe('in_progress');
  });

  it("updates a task's priority", async () => {
    const id = await seedTask();

    const res = await request(app).patch(`/api/tasks/${id}`).send({ priority: 'high' });

    expect(res.status).toBe(200);
    expect(successBody<TaskResponse>(res).data.priority).toBe('high');
  });

  it('returns 404 when the task does not exist', async () => {
    const missingId = new Types.ObjectId().toString();

    const res = await request(app).patch(`/api/tasks/${missingId}`).send({ status: 'done' });

    expect(res.status).toBe(404);
    expect(errorBody(res).error.message).toBe('Task not found');
  });

  it('returns 404 when the id format is invalid', async () => {
    const res = await request(app).patch('/api/tasks/not-a-valid-id').send({ status: 'done' });

    expect(res.status).toBe(404);
    expect(errorBody(res).error.message).toBe('Task not found');
  });

  it('returns 400 for an invalid status value', async () => {
    const id = await seedTask();

    const res = await request(app).patch(`/api/tasks/${id}`).send({ status: 'blocked' });

    expect(res.status).toBe(400);
    expect(errorBody(res).error.details?.[0]?.field).toBe('status');
  });

  it('returns 400 when no updatable field is provided', async () => {
    const id = await seedTask();

    const res = await request(app).patch(`/api/tasks/${id}`).send({});

    expect(res.status).toBe(400);
    expect(errorBody(res).error.details?.[0]?.message).toBe(
      'Provide at least one field to update: status or priority',
    );
  });

  it('returns 400 when trying to update fields other than status/priority', async () => {
    const id = await seedTask();

    const res = await request(app).patch(`/api/tasks/${id}`).send({ title: 'Renamed' });

    expect(res.status).toBe(400);
    const saved = await TaskModel.findById(id).lean();
    expect(saved?.title).not.toBe('Renamed');
  });
});
