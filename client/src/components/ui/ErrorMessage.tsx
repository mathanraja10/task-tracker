import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  isRetrying = false,
}: ErrorMessageProps) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-rose-800">{title}</h3>
          <p className="mt-1 text-sm text-rose-700">{message}</p>
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} isLoading={isRetrying}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
