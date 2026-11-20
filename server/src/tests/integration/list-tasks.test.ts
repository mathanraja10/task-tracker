import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { TaskModel } from '../../models/task.model.js';
import type { TaskResponse } from '../../types/task.types.js';
import { seedTask } from '../factories/task.factory.js';
import { errorBody, pageBody, successBody } from '../helpers/response.js';

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

  it('reports no next page when every match fits on one page', async () => {
    const res = await request(app).get('/api/tasks');

    expect(pageBody(res).meta.nextCursor).toBeNull();
  });
});

describe('GET /api/tasks — cursor pagination', () => {
  /** Follows `nextCursor` until the last page and returns every page's titles. */
  async function collectPages(query: Record<string, string | number>): Promise<string[][]> {
    const pages: string[][] = [];
    let cursor: string | null = null;
    do {
      const res = await request(app)
        .get('/api/tasks')
        .query({ ...query, ...(cursor && { cursor }) });
      expect(res.status).toBe(200);
      const body = pageBody(res);
      pages.push(body.data.map((t) => t.title));
      cursor = body.meta.nextCursor;
    } while (cursor !== null && pages.length < 20);
    return pages;
  }

  it('walks every task exactly once, newest first', async () => {
    for (let i = 1; i <= 5; i += 1) await seedTask({ title: `Task ${i}` });

    const pages = await collectPages({ limit: 2 });

    expect(pages).toEqual([['Task 5', 'Task 4'], ['Task 3', 'Task 2'], ['Task 1']]);
  });

  it('does not repeat or skip tasks that share the same createdAt', async () => {
    // Insert through the driver so Mongoose doesn't overwrite the timestamps.
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    await TaskModel.collection.insertMany(
      ['A', 'B', 'C', 'D', 'E'].map((title) => ({
        title: `Same ${title}`,
        status: 'todo',
        priority: 'medium',
        createdAt,
        updatedAt: createdAt,
      })),
    );

    const titles = (await collectPages({ limit: 2 })).flat();

    expect(titles).toHaveLength(5);
    expect(new Set(titles).size).toBe(5);
  });

  it('keeps later pages stable when a newer task is created mid-pagination', async () => {
    for (let i = 1; i <= 4; i += 1) await seedTask({ title: `Task ${i}` });

    const first = await request(app).get('/api/tasks').query({ limit: 2 });
    await seedTask({ title: 'Brand new' });
    const second = await request(app)
      .get('/api/tasks')
      .query({ limit: 2, cursor: pageBody(first).meta.nextCursor ?? '' });

    expect(pageBody(second).data.map((t) => t.title)).toEqual(['Task 2', 'Task 1']);
  });

  it('applies filters on every page', async () => {
    for (let i = 1; i <= 3; i += 1) {
      await seedTask({ title: `High ${i}`, priority: 'high' });
      await seedTask({ title: `Low ${i}`, priority: 'low' });
    }

    const pages = await collectPages({ priority: 'high', limit: 2 });

    expect(pages).toEqual([['High 3', 'High 2'], ['High 1']]);
  });

  it('defaults to a page size of 20', async () => {
    await TaskModel.insertMany(
      Array.from({ length: 21 }, (_, i) => ({ title: `Bulk task ${i}` })),
    );

    const res = await request(app).get('/api/tasks');

    expect(pageBody(res).data).toHaveLength(20);
    expect(pageBody(res).meta.nextCursor).toEqual(expect.any(String));
  });

  it.each(['0', '101', '2.5', 'ten'])('returns 400 for limit=%s', async (limit) => {
    const res = await request(app).get('/api/tasks').query({ limit });

    expect(res.status).toBe(400);
    expect(errorBody(res).error.details?.[0]?.field).toBe('limit');
  });

  it.each([
    ['not base64 json', 'not-a-cursor'],
    ['valid JSON, wrong shape', Buffer.from('{"foo":1}').toString('base64url')],
    [
      'malformed id',
      Buffer.from(JSON.stringify({ createdAt: new Date().toISOString(), id: 'zzz' })).toString(
        'base64url',
      ),
    ],
  ])('returns 400 for a tampered cursor (%s)', async (_label, cursor) => {
    const res = await request(app).get('/api/tasks').query({ cursor });

    expect(res.status).toBe(400);
    expect(errorBody(res).error.details?.[0]?.field).toBe('cursor');
  });
});

describe('GET /api/tasks — text search', () => {
  beforeEach(async () => {
    await seedTask({ title: 'Fix login redirect', description: 'Users land on a 404 page.' });
    await seedTask({ title: 'Dark mode toggle', description: 'Persist the LOGIN theme choice.' });
    await seedTask({ title: 'Price shows $(amount)', description: 'Template not interpolated.' });
    await seedTask({ title: 'Update docs', description: 'Refresh the README.', status: 'done' });
  });

  it('matches title or description, case-insensitively and on partial words', async () => {
    const res = await request(app).get('/api/tasks').query({ q: 'LoGi' });

    expect(res.status).toBe(200);
    expect(pageBody(res).data.map((t) => t.title)).toEqual([
      'Dark mode toggle',
      'Fix login redirect',
    ]);
  });

  it('treats regex metacharacters literally', async () => {
    const res = await request(app).get('/api/tasks').query({ q: '$(amount)' });

    expect(pageBody(res).data.map((t) => t.title)).toEqual(['Price shows $(amount)']);
  });

  it('does not let a wildcard pattern match everything', async () => {
    const res = await request(app).get('/api/tasks').query({ q: '.*' });

    expect(pageBody(res).data).toHaveLength(0);
  });

  it('combines with filters', async () => {
    const res = await request(app).get('/api/tasks').query({ q: 'docs', status: 'todo' });

    expect(pageBody(res).data).toHaveLength(0);
  });

  it('trims the term and ignores a whitespace-only search', async () => {
    const trimmed = await request(app).get('/api/tasks').query({ q: '  redirect  ' });
    const blank = await request(app).get('/api/tasks').query({ q: '   ' });

    expect(pageBody(trimmed).data.map((t) => t.title)).toEqual(['Fix login redirect']);
    expect(pageBody(blank).data).toHaveLength(4);
  });

  it('paginates search results', async () => {
    const first = await request(app).get('/api/tasks').query({ q: 'login', limit: 1 });
    const second = await request(app)
      .get('/api/tasks')
      .query({ q: 'login', limit: 1, cursor: pageBody(first).meta.nextCursor ?? '' });

    expect(pageBody(first).data.map((t) => t.title)).toEqual(['Dark mode toggle']);
    expect(pageBody(second).data.map((t) => t.title)).toEqual(['Fix login redirect']);
    expect(pageBody(second).meta.nextCursor).toBeNull();
  });

  it('returns 400 for a search term over 100 characters', async () => {
    const res = await request(app).get('/api/tasks').query({ q: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(errorBody(res).error.details?.[0]?.field).toBe('q');
  });
});
