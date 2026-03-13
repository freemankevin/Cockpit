import { Search, LayoutGrid, List, HardDrive, Activity, X } from 'lucide-react';
import PathBar from './PathBar';
import { getDiskUsageColor } from './utils';
import type { DiskUsage } from './types';

interface SFTPHeaderProps {
  currentPath: string;
  pathInputValue: string;
  isPathEditing: boolean;
  historyIndex: number;
  pathHistory: string[];
  viewMode: 'list' | 'grid';
  searchQuery: string;
  isSearchFocused: boolean;
  showTransferPanel: boolean;
  activeTransfers: number;
  diskUsage: DiskUsage | null;
  onNavigate: (path: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoUp: () => void;
  onPathInputChange: (value: string) => void;
  onPathSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPathEditStart: () => void;
  onPathEditCancel: () => void;
  onCopyPath: () => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onSearchChange: (value: string) => void;
  onSearchFocus: (focused: boolean) => void;
  onToggleTransferPanel: () => void;
}

const SFTPHeader = ({
  currentPath,
  pathInputValue,
  isPathEditing,
  historyIndex,
  pathHistory,
  viewMode,
  searchQuery,
  isSearchFocused,
  showTransferPanel,
  activeTransfers,
  diskUsage,
  onNavigate,
  onGoBack,
  onGoForward,
  onGoUp,
  onPathInputChange,
  onPathSubmit,
  onPathEditStart,
  onPathEditCancel,
  onCopyPath,
  onViewModeChange,
  onSearchChange,
  onSearchFocus,
  onToggleTransferPanel
}: SFTPHeaderProps) => (
  <div className="flex items-center justify-between w-full">
    <div className="flex items-center gap-3">
      <PathBar
        currentPath={currentPath}
        pathInputValue={pathInputValue}
        isPathEditing={isPathEditing}
        historyIndex={historyIndex}
        pathHistory={pathHistory}
        onNavigate={onNavigate}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onGoUp={onGoUp}
        onPathInputChange={onPathInputChange}
        onPathSubmit={onPathSubmit}
        onPathEditStart={onPathEditStart}
        onPathEditCancel={onPathEditCancel}
        onCopyPath={onCopyPath}
      />
    </div>

    <div className="flex items-center gap-2">
      {/* 搜索 */}
      <div className={`flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border transition-all duration-200 ${isSearchFocused ? 'border-gray-500' : 'border-white/10 hover:border-white/20'}`}>
        <Search className={`w-3.5 h-3.5 transition-colors ${isSearchFocused ? 'text-gray-300' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder="搜索文件..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onSearchFocus(true)}
          onBlur={() => onSearchFocus(false)}
          className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all placeholder:text-gray-500 text-gray-200"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 视图切换 */}
      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/10">
        <button onClick={() => onViewModeChange('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => onViewModeChange('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>

      {/* 传输面板 */}
      <button
        onClick={onToggleTransferPanel}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${showTransferPanel ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/10 border-white/10 text-gray-400 hover:bg-white/10'}`}
      >
        <Activity className="w-4 h-4" />
        {activeTransfers > 0 && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
      </button>

      {/* 磁盘使用 */}
      {diskUsage && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
          <HardDrive className="w-3.5 h-3.5 text-gray-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-300">{diskUsage.use_percentage}</span>
              <span className="text-xs text-gray-500">{diskUsage.used} / {diskUsage.size}</span>
            </div>
            <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${getDiskUsageColor(diskUsage.use_percentage)} transition-all duration-500`} style={{ width: diskUsage.use_percentage }} />
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default SFTPHeader;
