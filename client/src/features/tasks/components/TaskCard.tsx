import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { useDeleteTask } from '../api/delete-task';
import { useUpdateTask } from '../api/update-task';
import { isTaskStatus, STATUS_OPTIONS } from '../constants/task.constants';
import type { Task } from '../types/task.types';

import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: Task;
}

function TrashIcon() {
  return (
    <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function TaskCard({ task }: TaskCardProps) {
  const statusSelectId = useId();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDone = task.status === 'done';

  const errorMessage = updateTask.isError
    ? `Couldn't update status. ${getErrorMessage(updateTask.error)}`
    : deleteTask.isError
      ? `Couldn't delete task. ${getErrorMessage(deleteTask.error)}`
      : undefined;

  return (
    <article
      aria-labelledby={`${statusSelectId}-title`}
      aria-busy={deleteTask.isPending || undefined}
      className={cn(
        'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-opacity',
        deleteTask.isPending && 'opacity-50',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3
          id={`${statusSelectId}-title`}
          className={cn(
            'min-w-0 text-sm font-semibold break-words text-slate-900',
            isDone && 'text-slate-500 line-through decoration-slate-400',
          )}
        >
          {task.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {task.description && (
        <p className="mt-2 text-sm whitespace-pre-line break-words text-slate-600">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">
          Created <time dateTime={task.createdAt}>{formatDateTime(task.createdAt)}</time>
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor={statusSelectId} className="sr-only">
            Change status for {task.title}
          </label>
          {updateTask.isPending && <Spinner className="text-slate-400" />}
          <Select
            id={statusSelectId}
            selectSize="sm"
            className="w-36"
            options={STATUS_OPTIONS}
            value={task.status}
            disabled={updateTask.isPending || deleteTask.isPending}
            onChange={(event) => {
              const { value } = event.target;
              if (isTaskStatus(value) && value !== task.status) {
                updateTask.mutate({ id: task.id, changes: { status: value } });
              }
            }}
          />

          {isConfirmingDelete ? (
            <>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteTask.isPending}
                onClick={() => {
                  deleteTask.mutate(task.id, {
                    onError: () => {
                      setIsConfirmingDelete(false);
                    },
                  });
                }}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteTask.isPending}
                onClick={() => {
                  setIsConfirmingDelete(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${task.title}`}
              className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => {
                deleteTask.reset();
                setIsConfirmingDelete(true);
              }}
            >
              <TrashIcon />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMessage}
        </p>
      )}
    </article>
  );
}
