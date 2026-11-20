import type { TaskFilters } from '../types/task.types';

/** Hierarchical query keys: invalidating `lists()` refreshes every filtered list. */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
};
