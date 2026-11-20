import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  isTaskPriority,
  isTaskStatus,
  SEARCH_DEBOUNCE_MS,
  TASK_LIMITS,
} from '../constants/task.constants';
import type { TaskFilters, TaskPriority, TaskStatus } from '../types/task.types';

type SelectFilters = Pick<TaskFilters, 'status' | 'priority'>;

const URL_KEYS = ['status', 'priority', 'q'] as const;

/** Reads `?status=&priority=&q=`, ignoring unknown values. */
function readUrl(): { selects: SelectFilters; search: string } {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status') ?? '';
  const priority = params.get('priority') ?? '';
  return {
    selects: {
      ...(isTaskStatus(status) && { status }),
      ...(isTaskPriority(priority) && { priority }),
    },
    search: (params.get('q') ?? '').slice(0, TASK_LIMITS.SEARCH_MAX),
  };
}

function writeUrl(filters: TaskFilters): void {
  const url = new URL(window.location.href);
  for (const key of URL_KEYS) {
    const value = filters[key];
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(window.history.state, '', url);
}

/** Returns `value` once it has stopped changing for `delayMs`. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);
  return debounced;
}

/**
 * Filter and search state, persisted in the URL so filtered views survive
 * reloads and can be shared.
 *
 * `searchInput` is the raw text box value; `filters.q` is its trimmed,
 * debounced version, so typing doesn't send a request per keystroke.
 */
export function useTaskFilters() {
  const [initial] = useState(readUrl);
  const [selects, setSelects] = useState<SelectFilters>(initial.selects);
  const [searchInput, setSearchInput] = useState(initial.search);

  const trimmedSearch = searchInput.trim();
  const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS);
  // Clearing the search applies immediately; only typing is debounced.
  const q = trimmedSearch === '' ? '' : debouncedSearch;

  const { status, priority } = selects;
  // Unset keys are omitted so equivalent filters share one cache entry.
  const filters = useMemo<TaskFilters>(
    () => ({
      ...(status && { status }),
      ...(priority && { priority }),
      ...(q && { q }),
    }),
    [status, priority, q],
  );

  useEffect(() => {
    writeUrl(filters);
  }, [filters]);

  const setStatus = useCallback((value: TaskStatus | undefined) => {
    setSelects((prev) => ({ ...prev, status: value }));
  }, []);

  const setPriority = useCallback((value: TaskPriority | undefined) => {
    setSelects((prev) => ({ ...prev, priority: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSelects({});
    setSearchInput('');
  }, []);

  const hasActiveFilters = status !== undefined || priority !== undefined || trimmedSearch !== '';

  return {
    filters,
    searchInput,
    setSearchInput,
    setStatus,
    setPriority,
    clearFilters,
    hasActiveFilters,
  };
}
