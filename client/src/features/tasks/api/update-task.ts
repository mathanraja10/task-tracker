import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { taskSchema } from '../schemas/task.schema';
import type { Task, UpdateTaskPayload } from '../types/task.types';

import { taskKeys } from './task.keys';

export interface UpdateTaskVariables {
  id: string;
  changes: UpdateTaskPayload;
}

interface UpdateTaskContext {
  snapshots: [QueryKey, Task[] | undefined][];
}

export async function updateTask({ id, changes }: UpdateTaskVariables): Promise<Task> {
  const response = await apiClient.patch(`/tasks/${encodeURIComponent(id)}`, {
    body: changes,
    schema: taskSchema,
  });
  return response.data;
}

/**
 * Optimistically applies the change to every cached list, rolls back on
 * failure, then re-syncs with the server (a status change can move a task
 * out of the active filter).
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, UpdateTaskVariables, UpdateTaskContext>({
    mutationFn: updateTask,
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const snapshots = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.lists() });

      queryClient.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (tasks) =>
        tasks?.map((task) => (task.id === id ? { ...task, ...changes } : task)),
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([queryKey, tasks]) => {
        queryClient.setQueryData(queryKey, tasks);
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}
