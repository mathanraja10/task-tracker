import type { InfiniteData } from '@tanstack/react-query';

import type { Task, TaskPage } from '../types/task.types';

/** Cached shape of every `taskKeys.list(...)` entry. */
export type TaskListData = InfiniteData<TaskPage, string | undefined>;

/**
 * Applies `update` to the tasks of every loaded page, keeping each page's
 * cursor intact. Pass to `queryClient.setQueriesData`.
 */
export function mapCachedTasks(update: (tasks: Task[]) => Task[]) {
  return (data: TaskListData | undefined): TaskListData | undefined =>
    data && {
      ...data,
      pages: data.pages.map((page) => ({ ...page, data: update(page.data) })),
    };
}
