import { TaskBoard } from '@/features/tasks';

export function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <img src="/favicon.svg" alt="" className="size-8" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Team Task Tracker
            </h1>
            <p className="text-xs text-slate-500">Log, filter and resolve tasks and bugs.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <TaskBoard />
      </main>
    </div>
  );
}
