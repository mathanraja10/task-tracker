import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { TaskModel } from '../../models/task.model.js';
import type { TaskResponse } from '../../types/task.types.js';
import { buildTaskPayload } from '../factories/task.factory.js';
import { errorBody, successBody } from '../helpers/response.js';

const app = createApp();

describe('POST /api/tasks', () => {
  it('creates a task and returns 201 with the saved fields', async () => {
    const payload = buildTaskPayload({ priority: 'high' });

    const res = await request(app).post('/api/tasks').send(payload);

    expect(res.status).toBe(201);
    const { data } = successBody<TaskResponse>(res);
    expect(data).toMatchObject({
      title: payload.title,
      description: payload.description,
      status: 'todo',
      priority: 'high',
    });
    expect(data.id).toMatch(/^[a-f\d]{24}$/i);
    expect(new Date(data.createdAt).toString()).not.toBe('Invalid Date');
    expect(res.headers.location).toBe(`/api/tasks/${data.id}`);

    const saved = await TaskModel.findById(data.id).lean();
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe(payload.title);
    expect(saved?.priority).toBe('high');
  });

  it('applies default status "todo" and priority "medium"', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Write docs' });

    expect(res.status).toBe(201);
    const { data } = successBody<TaskResponse>(res);
    expect(data.status).toBe('todo');
    expect(data.priority).toBe('medium');
    expect(data.description).toBeUndefined();
  });

  it('trims whitespace from the title', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   Padded title   ' });

    expect(res.status).toBe(201);
    expect(successBody<TaskResponse>(res).data.title).toBe('Padded title');
  });

  describe('validation errors', () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/tasks').send({ description: 'No title' });

      expect(res.status).toBe(400);
      expect(errorBody(res).error).toEqual({
        message: 'Validation failed',
        details: [{ field: 'title', message: 'Title is required' }],
      });
      expect(await TaskModel.countDocuments()).toBe(0);
    });

    it('returns 400 when title is shorter than 3 characters', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'ab' });

      expect(res.status).toBe(400);
      expect(errorBody(res).error.details).toContainEqual({
        field: 'title',
        message: 'Title must be at least 3 characters',
      });
    });

    it('rejects a title that is only whitespace', async () => {
      const res = await request(app).post('/api/tasks').send({ title: '     ' });

      expect(res.status).toBe(400);
      expect(errorBody(res).error.details?.[0]?.field).toBe('title');
    });

    it('returns 400 when title exceeds 100 characters', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'a'.repeat(101) });

      expect(res.status).toBe(400);
      expect(errorBody(res).error.details).toContainEqual({
        field: 'title',
        message: 'Title must be at most 100 characters',
      });
    });

    it('returns 400 when description exceeds 500 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send(buildTaskPayload({ description: 'a'.repeat(501) }));

      expect(res.status).toBe(400);
      expect(errorBody(res).error.details).toContainEqual({
        field: 'description',
        message: 'Description must be at most 500 characters',
      });
    });

    it('returns 400 for invalid status and priority values', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Valid title', status: 'archived', priority: 'urgent' });

      expect(res.status).toBe(400);
      const fields = errorBody(res).error.details?.map((d) => d.field);
      expect(fields).toEqual(expect.arrayContaining(['status', 'priority']));
    });

    it('returns 400 for malformed JSON', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{"title": ');

      expect(res.status).toBe(400);
      expect(errorBody(res).error.message).toBe('Malformed JSON in request body');
    });
  });
});
