import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import type { TaskResponse } from '../../types/task.types.js';
import { seedTask } from '../factories/task.factory.js';
import { errorBody, successBody } from '../helpers/response.js';

const app = createApp();

describe('GET /api/tasks', () => {
  beforeEach(async () => {
    // Sequential inserts so createdAt ordering is deterministic.
    await seedTask({ title: 'Todo low', status: 'todo', priority: 'low' });
    await seedTask({ title: 'Todo high', status: 'todo', priority: 'high' });
    await seedTask({ title: 'In progress high', status: 'in_progress', priority: 'high' });
    await seedTask({ title: 'Done medium', status: 'done', priority: 'medium' });
  });

  it('returns all tasks, newest first', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    const { data } = successBody<TaskResponse[]>(res);
    expect(data).toHaveLength(4);
    expect(data[0]?.title).toBe('Done medium');
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/tasks').query({ status: 'todo' });

    expect(res.status).toBe(200);
    const { data } = successBody<TaskResponse[]>(res);
    expect(data).toHaveLength(2);
    expect(data.every((t) => t.status === 'todo')).toBe(true);
  });

  it('filters by priority', async () => {
    const res = await request(app).get('/api/tasks').query({ priority: 'high' });

    const { data } = successBody<TaskResponse[]>(res);
    expect(data).toHaveLength(2);
    expect(data.every((t) => t.priority === 'high')).toBe(true);
  });

  it('filters by status and priority combined', async () => {
    const res = await request(app).get('/api/tasks').query({ status: 'todo', priority: 'high' });

    const { data } = successBody<TaskResponse[]>(res);
    expect(data).toHaveLength(1);
    expect(data[0]?.title).toBe('Todo high');
  });

  it('treats empty filter values as "all"', async () => {
    const res = await request(app).get('/api/tasks?status=&priority=');

    expect(res.status).toBe(200);
    expect(successBody<TaskResponse[]>(res).data).toHaveLength(4);
  });

  it('returns 400 for an invalid filter value', async () => {
    const res = await request(app).get('/api/tasks').query({ status: 'archived' });

    expect(res.status).toBe(400);
    expect(errorBody(res).error.details?.[0]?.field).toBe('status');
  });
});
