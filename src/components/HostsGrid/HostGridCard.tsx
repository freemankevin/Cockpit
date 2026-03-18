import OSIcon, { getOSLabel } from '../OSIcon';
import StatusBadge from './StatusBadge';
import DiskProgressBar from './DiskProgressBar';
import { formatMemory, getSystemDisk, getDiskTextColor } from './types';
import type { HostGridCardProps } from './types';

export const HostGridCard = ({
  host,
  onOpenTerminal,
  onOpenSFTP
}: HostGridCardProps) => {
  const systemDisk = getSystemDisk(host.disks);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4
               hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center"
               title={`${getOSLabel(host.os_key, host.system_type)}${host.os_version ? ` (${host.os_version})` : ''}`}>
            <OSIcon
              osKey={host.os_key}
              systemType={host.system_type}
              size="md"
            />
          </div>
          <div>
            <h3 className="font-medium text-sm text-gray-900">{host.name || host.address}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-gray-500">{host.address}</span>
              <StatusBadge status={host.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <i className="fa-solid fa-microchip w-3.5 h-3.5 text-blue-500"></i>
          <span>{host.cpu_cores || '-'} Cores {formatMemory(host.memory_gb)} {host.architecture || ''}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <i className="fa-solid fa-hard-drive w-3.5 h-3.5 text-amber-500"></i>
          <span>{host.disks?.length || '-'} Disks</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <i className="fa-solid fa-desktop w-3.5 h-3.5 text-purple-500"></i>
          <span>{getOSLabel(host.os_key, host.system_type)}</span>
        </div>
      </div>

      {/* Disk */}
      {systemDisk && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">System Disk {systemDisk.total}GB</span>
            <span className={`text-xs font-medium ${getDiskTextColor(systemDisk.usage)}`}>
              {systemDisk.usage.toFixed(0)}%
            </span>
          </div>
          <DiskProgressBar usage={systemDisk.usage} />
          <div className="text-[10px] text-gray-400 mt-1">
            {systemDisk.used}G / {systemDisk.total}G
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onOpenTerminal}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white
                   rounded text-xs font-medium transition-colors
                   flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-terminal w-3.5 h-3.5"></i>
          Terminal
        </button>
        <button
          onClick={onOpenSFTP}
          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700
                   rounded text-xs font-medium transition-colors
                   flex items-center justify-center gap-1"
        >
          <i className="fa-solid fa-folder-open w-3.5 h-3.5"></i>
          SFTP
        </button>
      </div>
    </div>
  );
};

export default HostGridCard;
