import type { TaskPriority, TaskStatus } from '../types/task.types.js';

export interface SeedTask {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
}

/** Realistic sample data covering every status × priority combination. */
export const SEED_TASKS: readonly SeedTask[] = [
  {
    title: 'Login returns 500 after repeated wrong passwords',
    description:
      'Steps: enter a wrong password three times, then the correct one. Expected: sign-in. Actual: 500 Internal Server Error.',
    status: 'todo',
    priority: 'high',
  },
  {
    title: 'Add rate limiting to the public API',
    description: 'Protect /api/tasks from abuse; 100 requests per minute per IP is a sensible start.',
    status: 'todo',
    priority: 'medium',
  },
  {
    title: 'Update footer copyright year',
    status: 'todo',
    priority: 'low',
  },
  {
    title: 'Dashboard crashes when a task has no description',
    description: 'TypeError: cannot read properties of undefined (reading "length") in TaskCard.',
    status: 'in_progress',
    priority: 'high',
  },
  {
    title: 'Write onboarding guide for new engineers',
    description: 'Cover local setup, the test suite, and the deployment checklist.',
    status: 'in_progress',
    priority: 'medium',
  },
  {
    title: 'Tidy up unused CSS utilities',
    status: 'in_progress',
    priority: 'low',
  },
  {
    title: 'Fix CORS errors on staging',
    description: 'CLIENT_ORIGIN was missing the https:// prefix in the staging environment.',
    status: 'done',
    priority: 'high',
  },
  {
    title: 'Upgrade CI to Node 22 LTS',
    status: 'done',
    priority: 'medium',
  },
  {
    title: 'Rename "Bugs" tab to "Issues"',
    description: 'Product requested consistent terminology across the app.',
    status: 'done',
    priority: 'low',
  },
];
