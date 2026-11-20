import { useCallback, useEffect, useState } from 'react';

import { isTaskPriority, isTaskStatus } from '../constants/task.constants';
import type { TaskFilters, TaskPriority, TaskStatus } from '../types/task.types';

/** Drops unset keys so `{}` and `{ status: undefined }` share a cache entry. */
function compactFilters({ status, priority }: TaskFilters): TaskFilters {
  return {
    ...(status && { status }),
    ...(priority && { priority }),
  };
}

/** Reads filters from `?status=&priority=`, ignoring unknown values. */
function readFiltersFromUrl(): TaskFilters {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status') ?? '';
  const priority = params.get('priority') ?? '';
  return compactFilters({
    ...(isTaskStatus(status) && { status }),
    ...(isTaskPriority(priority) && { priority }),
  });
}

function writeFiltersToUrl(filters: TaskFilters): void {
  const url = new URL(window.location.href);
  for (const key of ['status', 'priority'] as const) {
    const value = filters[key];
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(window.history.state, '', url);
}

/** Filter state persisted in the URL so filtered views survive reloads and can be shared. */
export function useTaskFilters() {
  const [filters, setFilters] = useState<TaskFilters>(readFiltersFromUrl);

  useEffect(() => {
    writeFiltersToUrl(filters);
  }, [filters]);

  const setStatus = useCallback((status: TaskStatus | undefined) => {
    setFilters((prev) => compactFilters({ ...prev, status }));
  }, []);

  const setPriority = useCallback((priority: TaskPriority | undefined) => {
    setFilters((prev) => compactFilters({ ...prev, priority }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = filters.status !== undefined || filters.priority !== undefined;

  return { filters, setStatus, setPriority, clearFilters, hasActiveFilters };
}
