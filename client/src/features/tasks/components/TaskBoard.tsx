import { Spinner } from '@/components/ui/Spinner';

import { useTasks } from '../api/get-tasks';
import { useTaskFilters } from '../hooks/use-task-filters';

import { CreateTaskForm } from './CreateTaskForm';
import { TaskFilterBar } from './TaskFilterBar';
import { TaskList } from './TaskList';

export function TaskBoard() {
  const { filters, setStatus, setPriority, clearFilters, hasActiveFilters } = useTaskFilters();
  const tasksQuery = useTasks(filters);
  const taskCount = tasksQuery.data?.length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8">
      <section
        aria-labelledby="create-task-heading"
        className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-6"
      >
        <h2 id="create-task-heading" className="text-base font-semibold text-slate-900">
          New task
        </h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">Log a task or bug for the team.</p>
        <CreateTaskForm />
      </section>

      <section aria-labelledby="tasks-heading" className="min-w-0 space-y-4">
        <div className="flex items-center gap-2">
          <h2 id="tasks-heading" className="text-base font-semibold text-slate-900">
            Tasks
          </h2>
          {taskCount !== undefined && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 tabular-nums">
              {taskCount}
            </span>
          )}
          {tasksQuery.isFetching && !tasksQuery.isPending && (
            <Spinner label="Refreshing tasks" className="text-slate-400" />
          )}
        </div>

        <TaskFilterBar
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onClear={clearFilters}
        />

        <TaskList
          tasks={tasksQuery.data}
          isPending={tasksQuery.isPending}
          error={tasksQuery.error}
          isShowingStaleData={tasksQuery.isPlaceholderData}
          isRefetching={tasksQuery.isRefetching}
          hasActiveFilters={hasActiveFilters}
          onRetry={() => void tasksQuery.refetch()}
          onClearFilters={clearFilters}
        />
      </section>
    </div>
  );
}
