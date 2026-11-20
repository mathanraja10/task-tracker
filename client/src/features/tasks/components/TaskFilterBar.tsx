import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

import {
  isTaskPriority,
  isTaskStatus,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '../constants/task.constants';
import type { TaskFilters, TaskPriority, TaskStatus } from '../types/task.types';

interface TaskFilterBarProps {
  filters: TaskFilters;
  hasActiveFilters: boolean;
  onStatusChange: (status: TaskStatus | undefined) => void;
  onPriorityChange: (priority: TaskPriority | undefined) => void;
  onClear: () => void;
}

export function TaskFilterBar({
  filters,
  hasActiveFilters,
  onStatusChange,
  onPriorityChange,
  onClear,
}: TaskFilterBarProps) {
  const id = useId();
  const statusId = `${id}-status`;
  const priorityId = `${id}-priority`;

  return (
    <div
      role="search"
      aria-label="Filter tasks"
      className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end"
    >
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
  );
}
