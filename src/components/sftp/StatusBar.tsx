import { Folder, Activity, Clock, Wifi } from 'lucide-react';

interface StatusBarProps {
  fileCount: number;
  selectedCount: number;
  searchQuery: string;
  activeTransfers: number;
  hostAddress: string;
  connectionTime?: string;
}

const StatusBar = ({
  fileCount,
  selectedCount,
  searchQuery,
  activeTransfers,
  hostAddress,
  connectionTime
}: StatusBarProps) => {
  const folderCount = fileCount; // 简化计算

  return (
    <div className="h-8 bg-[#1a1a1a] border-t border-white/5 flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        {/* 文件统计 */}
        <div className="flex items-center gap-2 text-gray-400">
          <Folder className="w-3.5 h-3.5" />
          <span>{folderCount} 个项目</span>
          {selectedCount > 0 && (
            <span className="text-blue-400 font-medium">
              ({selectedCount} 已选择)
            </span>
          )}
        </div>

        {/* 搜索状态 */}
        {searchQuery && (
          <div className="flex items-center gap-1 text-amber-400">
            <span>搜索: "{searchQuery}"</span>
          </div>
        )}

        {/* 传输状态 */}
        {activeTransfers > 0 && (
          <div className="flex items-center gap-1.5 text-blue-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>{activeTransfers} 个传输进行中</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* 连接状态 */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
          <span>已连接</span>
        </div>

        {/* 连接时间 */}
        {connectionTime && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{connectionTime}</span>
          </div>
        )}

        {/* 主机地址 */}
        <div className="text-gray-400">
          {hostAddress}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
