import { getDiskColor } from './types';
import type { DiskProgressBarProps } from './types';

export const DiskProgressBar = ({ usage, className = '' }: DiskProgressBarProps) => {
  return (
    <div className={`h-1.5 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${getDiskColor(usage)} transition-all duration-300 rounded-full`}
        style={{ width: `${Math.min(usage, 100)}%` }}
      />
    </div>
  );
};

export default DiskProgressBar;
