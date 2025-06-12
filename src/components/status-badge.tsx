import React from 'react';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let color = '';
  let textColor = 'text-white';
  
  switch (status.toLowerCase()) {
    case 'active':
      color = 'bg-green-500';
      break;
    case 'inactive':
      color = 'bg-amber-500';
      break;
    case 'cancelled':
      color = 'bg-red-500';
      break;
    case 'pending':
      color = 'bg-blue-500';
      break;
    case 'suspended':
      color = 'bg-purple-500';
      break;
    case 'failed':
      color = 'bg-red-500';
      break;
    default:
      color = 'bg-gray-500';
  }
  
  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', color, textColor, className)}>
      {status}
    </span>
  );
};

export default StatusBadge;