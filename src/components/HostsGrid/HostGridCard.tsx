import { useState } from 'react';
import {
  HardDrive,
  Folder,
  Database,
  AlertTriangle,
  Cpu,
  Monitor,
  ChevronUp,
  Terminal,
  FolderOpen,
} from 'lucide-react';
import OSIcon, { getOSLabel } from '../OSIcon';
import StatusBadge from './StatusBadge';
import DiskProgressBar from './DiskProgressBar';
import { formatMemory, getSystemDisk, getDiskTextColor, bytesToGB } from './types';
import type { HostGridCardProps, DiskInfo } from './types';

export const HostGridCard = ({
  host,
  onOpenTerminal,
  onOpenSFTP
}: HostGridCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const systemDisk = getSystemDisk(host.disks);
  const hasMultipleDisks = (host.disks?.length || 0) > 1;

  // Render a single disk item
  const renderDiskItem = (disk: DiskInfo, isCompact = false) => {
    const isSystemDisk = disk.mount_point === '/';
    const isUnmounted = disk.status === 'unmounted';
    // Use physical_disk for the label (e.g., "sda" from "/dev/sda")
    const diskLabel = (disk.physical_disk || disk.device || '').split('/').pop() || '-';

    if (isCompact) {
      return (
        <div
          key={disk.device}
          className="bg-background-tertiary rounded-lg p-3 border border-border-primary hover:border-macos-gray-2 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <HardDrive className={`w-4 h-4 ${isUnmounted ? 'text-text-tertiary' : isSystemDisk ? 'text-macos-blue' : 'text-text-secondary'}`} />
              <span className="text-xs font-medium text-text-secondary">
                {isUnmounted ? 'Unmounted' : isSystemDisk ? 'System' : 'Data'}
              </span>
            </div>
            {/* Show physical disk name */}
            <span className="text-[10px] text-text-tertiary font-mono" title={`Physical: ${disk.physical_disk || disk.device}`}>
              {diskLabel}
            </span>
          </div>
          <DiskProgressBar usage={disk.usage} className="mb-2" />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-tertiary">{bytesToGB(disk.used)} GB / {bytesToGB(disk.total)} GB</span>
            <span className={`font-medium ${getDiskTextColor(disk.usage)}`}>
              {disk.usage.toFixed(1)}%
            </span>
          </div>
          {disk.mount_point && (
            <div className="mt-1.5 text-[10px] text-text-tertiary truncate flex items-center gap-1">
              <Folder className="w-3 h-3 text-macos-orange" />
              {disk.mount_point}
            </div>
          )}
          {disk.fs_type && (
            <div className="text-[10px] text-text-tertiary truncate flex items-center gap-1">
              <Database className="w-3 h-3 text-macos-purple" />
              {disk.fs_type}
            </div>
          )}
          {isUnmounted && (
            <div className="mt-1.5 text-[10px] text-macos-orange truncate flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Unmounted or Unformatted
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="bg-background-secondary/90 rounded-lg border border-border-primary p-4
               hover:border-border-tertiary hover:shadow-macos-card-hover transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <OSIcon
            osKey={host.os_key}
            systemType={host.system_type}
            size="md"
            title={host.os_pretty_name || `${getOSLabel(host.os_key, host.system_type)}${host.os_version ? ` (${host.os_version})` : ''}`}
          />
          <div>
            <h3 className="font-medium text-sm text-text-primary">{host.name || host.address}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-text-secondary">{host.address}</span>
              <StatusBadge status={host.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Cpu className="w-3.5 h-3.5 text-macos-blue" />
          <span>{host.cpu_cores || '-'} Cores {formatMemory(host.memory_gb)} {host.architecture || ''}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <HardDrive className="w-3.5 h-3.5 text-macos-orange" />
          <span>{host.disks?.length || '-'} Disks</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Monitor className="w-3.5 h-3.5 text-macos-purple" />
          <span>{getOSLabel(host.os_key, host.system_type)}</span>
        </div>
      </div>

      {/* Disk - Main display */}
      {systemDisk && (
        <div className="mb-3">
          {/* Main disk info - clickable if multiple disks */}
          <div
            className={`p-2.5 bg-background-tertiary/80 rounded-lg border border-border-secondary ${hasMultipleDisks ? 'cursor-pointer hover:bg-background-hover hover:border-border-tertiary' : ''}`}
            onClick={() => hasMultipleDisks && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <HardDrive className={`w-3.5 h-3.5 ${systemDisk.mount_point === '/' ? 'text-macos-blue' : 'text-text-secondary'}`} />
                <span className="text-xs text-text-secondary">
                  {systemDisk.mount_point === '/' ? 'System Disk' : systemDisk.mount_point}
                </span>
              </div>
              <span className={`text-xs font-medium ${getDiskTextColor(systemDisk.usage)}`}>
                {systemDisk.usage.toFixed(0)}%
              </span>
            </div>
            <DiskProgressBar usage={systemDisk.usage} />
            <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1">
              <span>{bytesToGB(systemDisk.used)} GB / {bytesToGB(systemDisk.total)} GB</span>
              {/* Show physical disk name */}
              <span className="font-mono text-[10px] text-text-secondary" title={`Physical: ${systemDisk.physical_disk || systemDisk.device}`}>
                {(systemDisk.physical_disk || systemDisk.device || '').split('/').pop()}
              </span>
            </div>
          </div>

          {/* Expanded disk list */}
          {isExpanded && hasMultipleDisks && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-secondary">All Disks</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="text-xs text-text-tertiary hover:text-text-primary"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {host.disks?.map((disk) => renderDiskItem(disk, true))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onOpenTerminal}
          className="flex-1 py-2 bg-macos-blue hover:brightness-110 text-white
                   rounded-md text-xs font-medium transition-all duration-200
                   flex items-center justify-center gap-1.5
                   shadow-macos-button hover:shadow-glow-blue
                   active:scale-[0.98]"
        >
          <Terminal className="w-3.5 h-3.5" />
          Terminal
        </button>
        <button
          onClick={onOpenSFTP}
          className="flex-1 py-2 bg-background-tertiary hover:bg-background-hover text-text-primary
                   rounded-md text-xs font-medium transition-all duration-200
                   flex items-center justify-center gap-1.5
                   border border-border-primary hover:border-border-tertiary"
        >
          <FolderOpen className="w-3.5 h-3.5 text-macos-green" />
          SFTP
        </button>
      </div>
    </div>
  );
};

export default HostGridCard;