import { Badge } from '@/components/ui/Badge';

import { STATUS_LABELS, STATUS_TONES } from '../constants/task.constants';
import type { TaskStatus } from '../types/task.types';

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge tone={STATUS_TONES[status]} dot>
      <span className="sr-only">Status: </span>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
