import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { taskSchema } from '../schemas/task.schema';
import type { CreateTaskPayload, Task } from '../types/task.types';

import { taskKeys } from './task.keys';

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await apiClient.post('/tasks', { body: payload, schema: taskSchema });
  return response.data;
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}
