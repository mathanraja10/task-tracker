/**
 * Single source of truth for task enums and limits.
 * The Mongoose model, the Zod schemas and the TS types all derive from these.
 */
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export const DEFAULT_TASK_STATUS = 'todo' satisfies (typeof TASK_STATUSES)[number];
export const DEFAULT_TASK_PRIORITY = 'medium' satisfies (typeof TASK_PRIORITIES)[number];

export const TASK_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
} as const;

export const TASK_LIST_LIMITS = {
  /** Page size when `?limit` is omitted. */
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  /** Longest accepted `?q` search term. */
  SEARCH_MAX: 100,
} as const;
