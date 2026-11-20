import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { deleteTaskResultSchema } from '../schemas/task.schema';
import type { DeleteTaskResult } from '../types/task.types';

import { mapCachedTasks, type TaskListData } from './task-list-cache';
import { taskKeys } from './task.keys';

export async function deleteTask(id: string): Promise<DeleteTaskResult> {
  const response = await apiClient.delete(`/tasks/${encodeURIComponent(id)}`, {
    schema: deleteTaskResultSchema,
  });
  return response.data;
}

/**
 * Pessimistic delete: the card stays (with a pending state) until the server
 * confirms, so failures can be shown in context.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: ({ id }) => {
      queryClient.setQueriesData<TaskListData>(
        { queryKey: taskKeys.lists() },
        mapCachedTasks((tasks) => tasks.filter((task) => task.id !== id)),
      );
      return queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
