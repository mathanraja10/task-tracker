import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';

import type { Task } from '../types/task.types';

import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[] | undefined;
  isPending: boolean;
  error: Error | null;
  /** True while stale results from a previous filter are displayed. */
  isShowingStaleData: boolean;
  isRefetching: boolean;
  hasActiveFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
}

function TaskCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-3 h-3 w-5/6" />
      <Skeleton className="mt-2 h-3 w-2/3" />
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-36" />
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  isPending,
  error,
  isShowingStaleData,
  isRefetching,
  hasActiveFilters,
  onRetry,
  onClearFilters,
}: TaskListProps) {
  if (isPending) {
    return (
      <div role="status" aria-label="Loading tasks" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!tasks) {
    return (
      <ErrorMessage
        title="Couldn't load tasks"
        message={getErrorMessage(error)}
        onRetry={onRetry}
        isRetrying={isRefetching}
      />
    );
  }

  if (tasks.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        title="No matching tasks"
        description="No tasks match the selected filters. Try a different status or priority."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No tasks yet"
        description="Create your first task or bug report using the form."
      />
    );
  }

  return (
    <ul
      aria-busy={isShowingStaleData || undefined}
      className={cn('space-y-3 transition-opacity', isShowingStaleData && 'opacity-60')}
    >
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskCard task={task} />
        </li>
      ))}
    </ul>
  );
}
