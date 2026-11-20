import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { taskSchema } from '../schemas/task.schema';
import type { TaskFilters, TaskPage } from '../types/task.types';

import { taskKeys } from './task.keys';

export async function getTasks(
  filters: TaskFilters,
  cursor: string | undefined,
  signal?: AbortSignal,
): Promise<TaskPage> {
  return apiClient.getPage('/tasks', {
    query: { status: filters.status, priority: filters.priority, q: filters.q, cursor },
    schema: taskSchema,
    ...(signal && { signal }),
  });
}

/**
 * Server-side filtered, cursor-paginated task list. Each filter combination
 * has its own cache entry; the previous list stays visible while a new one loads.
 */
export function useTasks(filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ pageParam, signal }) => getTasks(filters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
    // Flatten pages so components only ever see a list of tasks.
    select: (data) => data.pages.flatMap((page) => page.data),
    placeholderData: keepPreviousData,
  });
}
