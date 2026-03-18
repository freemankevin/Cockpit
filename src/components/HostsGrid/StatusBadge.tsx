import type { StatusBadgeProps } from './types';

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const configs = {
    connected: {
      dot: 'bg-emerald-500',
      label: 'Running'
    },
    warning: {
      dot: 'bg-amber-500',
      label: 'Warning'
    },
    default: {
      dot: 'bg-gray-400',
      label: 'Offline'
    }
  };

  const config = configs[status as keyof typeof configs] || configs.default;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
