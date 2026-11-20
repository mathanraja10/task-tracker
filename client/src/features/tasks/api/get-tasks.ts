import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { taskListSchema } from '../schemas/task.schema';
import type { Task, TaskFilters } from '../types/task.types';

import { taskKeys } from './task.keys';

export async function getTasks(filters: TaskFilters, signal?: AbortSignal): Promise<Task[]> {
  const response = await apiClient.get('/tasks', {
    query: { status: filters.status, priority: filters.priority },
    schema: taskListSchema,
    ...(signal && { signal }),
  });
  return response.data;
}

/** Server-side filtered task list. Keeps showing the previous list while a new filter loads. */
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ signal }) => getTasks(filters, signal),
    placeholderData: keepPreviousData,
  });
}
