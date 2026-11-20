import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import {
  isTaskPriority,
  isTaskStatus,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  TASK_LIMITS,
} from '../constants/task.constants';
import type { TaskFilters, TaskPriority, TaskStatus } from '../types/task.types';

interface TaskFilterBarProps {
  filters: TaskFilters;
  searchInput: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: TaskStatus | undefined) => void;
  onPriorityChange: (priority: TaskPriority | undefined) => void;
  onClear: () => void;
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function TaskFilterBar({
  filters,
  searchInput,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onClear,
}: TaskFilterBarProps) {
  const id = useId();
  const searchId = `${id}-search`;
  const statusId = `${id}-status`;
  const priorityId = `${id}-priority`;

  return (
    <div
      role="search"
      aria-label="Search and filter tasks"
      className="space-y-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200"
    >
      <div className="space-y-1">
        <label htmlFor={searchId} className="block text-xs font-medium text-slate-600">
          Search
        </label>
        <div className="relative">
          <SearchIcon />
          <Input
            id={searchId}
            type="search"
            className="pl-9"
            placeholder="Title or description"
            autoComplete="off"
            maxLength={TASK_LIMITS.SEARCH_MAX}
            value={searchInput}
            onChange={(event) => {
              onSearchChange(event.target.value);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor={statusId} className="block text-xs font-medium text-slate-600">
            Status
          </label>
          <Select
            id={statusId}
            options={STATUS_OPTIONS}
            placeholderOption="All statuses"
            value={filters.status ?? ''}
            onChange={(event) => {
              const { value } = event.target;
              onStatusChange(isTaskStatus(value) ? value : undefined);
            }}
          />
        </div>

        <div className="flex-1 space-y-1">
          <label htmlFor={priorityId} className="block text-xs font-medium text-slate-600">
            Priority
          </label>
          <Select
            id={priorityId}
            options={PRIORITY_OPTIONS}
            placeholderOption="All priorities"
            value={filters.priority ?? ''}
            onChange={(event) => {
              const { value } = event.target;
              onPriorityChange(isTaskPriority(value) ? value : undefined);
            }}
          />
        </div>

        <Button variant="ghost" onClick={onClear} disabled={!hasActiveFilters}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
