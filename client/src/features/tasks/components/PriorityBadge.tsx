import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

import { PRIORITY_LABELS, PRIORITY_TONES, TASK_PRIORITIES } from '../constants/task.constants';
import type { TaskPriority } from '../types/task.types';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

/** Signal-bar icon: 1 bar for low, 2 for medium, 3 for high (not color-only). */
function PriorityBars({ priority }: PriorityBadgeProps) {
  const level = TASK_PRIORITIES.indexOf(priority) + 1;
  return (
    <svg className="size-3" viewBox="0 0 12 12" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <rect
          key={bar}
          x={(bar - 1) * 4}
          y={12 - bar * 4}
          width="3"
          height={bar * 4}
          rx="0.75"
          className={cn('fill-current', bar > level && 'opacity-25')}
        />
      ))}
    </svg>
  );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge tone={PRIORITY_TONES[priority]}>
      <PriorityBars priority={priority} />
      {PRIORITY_LABELS[priority]}
      <span className="sr-only"> priority</span>
    </Badge>
  );
}
