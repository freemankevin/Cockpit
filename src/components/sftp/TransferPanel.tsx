import type { TransferTask, TransferLog, LogFilter } from './types';
import { formatFileSize } from './utils';
import type { UploadTask } from './hooks/useUploadManager';
import type { DownloadTask } from './hooks/useDownloadManager';

interface TransferPanelProps {
  transferTasks: TransferTask[];
  transferLogs: TransferLog[];
  activeLogFilter: LogFilter;
  onFilterChange: (filter: LogFilter) => void;
  onClearLogs: () => void;
  onClearLogsByFilter?: (filter: LogFilter) => void;
  onPauseTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
  // Upload tasks for concurrent display
  uploadTasks?: UploadTask[];
  onViewUploadTask?: (task: UploadTask) => void;
  onCancelUpload?: (uploadId: string) => void;
  // Download tasks for concurrent display
  downloadTasks?: DownloadTask[];
  onViewDownloadTask?: (task: DownloadTask) => void;
  onCancelDownload?: (downloadId: string) => void;
}

const getStatusColor = (status: TransferTask['status']) => {
  switch (status) {
    case 'completed': return 'text-emerald-500';
    case 'failed': return 'text-red-500';
    case 'cancelled': return 'text-amber-500';
    case 'transferring': return 'text-blue-500';
    case 'paused': return 'text-amber-500';
    default: return 'text-gray-400';
  }
};

const getStatusIcon = (status: TransferTask['status']) => {
  switch (status) {
    case 'completed': return <i className="fa-solid fa-check text-[11px]" />;
    case 'failed': return <i className="fa-solid fa-circle-exclamation text-[11px]" />;
    case 'cancelled': return <i className="fa-solid fa-ban text-[11px]" />;
    case 'transferring': return <i className="fa-solid fa-spinner animate-spin text-[11px]" />;
    case 'paused': return <i className="fa-solid fa-clock text-[11px]" />;
    default: return <i className="fa-solid fa-clock text-[11px]" />;
  }
};

const TransferPanel = ({
  transferTasks,
  activeLogFilter,
  onFilterChange,
  onClearLogs,
  onClearLogsByFilter,
  onCancelTask,
  uploadTasks = [],
  onViewUploadTask,
  onCancelUpload,
  downloadTasks = [],
  onViewDownloadTask,
  onCancelDownload
}: TransferPanelProps) => {

  // Filter completed tasks based on current filter
  const completedTasks = transferTasks.filter(t => {
    if (t.status !== 'completed' && t.status !== 'failed' && t.status !== 'cancelled') return false;
    if (activeLogFilter === 'upload') return t.type === 'upload';
    if (activeLogFilter === 'download') return t.type === 'download';
    return true;
  });

  // Get active upload/download tasks for current filter
  const activeUploadTasks = uploadTasks.filter(t => 
    t.progress.stage !== 'completed' && t.progress.stage !== 'error'
  );
  
  const activeDownloadTasks = downloadTasks.filter(t => 
    t.progress.stage !== 'completed' && t.progress.stage !== 'error'
  );

  // Get completed count for a filter
  const getCompletedCount = (filter: LogFilter) => {
    if (filter === 'upload') return transferTasks.filter(t => (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') && t.type === 'upload').length;
    if (filter === 'download') return transferTasks.filter(t => (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') && t.type === 'download').length;
    return 0;
  };

  // Get active count for a filter
  const getActiveCount = (filter: LogFilter) => {
    if (filter === 'upload') return activeUploadTasks.length;
    if (filter === 'download') return activeDownloadTasks.length;
    return 0;
  };

  const currentCount = getCompletedCount(activeLogFilter);

  return (
    <div
      className="w-80 bg-[#1e1e1e] border-l border-white/5 flex flex-col"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(['upload', 'download'] as LogFilter[]).map((filter) => {
          const activeCount = getActiveCount(filter);
          const completedCount = getCompletedCount(filter);
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`flex-1 px-3 py-2 text-[12px] font-medium transition-all relative ${
                activeLogFilter === filter
                  ? 'bg-white/5 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-1">
                {filter === 'upload' && 'Upload'}
                {filter === 'download' && 'Download'}
                {/* Show active count if there are active tasks */}
                {activeCount > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    filter === 'upload' ? 'bg-blue-500/30 text-blue-300' :
                    'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {activeCount}
                  </span>
                )}
                {/* Show completed count if there are completed tasks and no active tasks */}
                {activeCount === 0 && completedCount > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    filter === 'upload' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {completedCount}
                  </span>
                )}
              </span>
              {activeLogFilter === filter && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-3 space-y-3 bg-[#0d0d0d]">
        {/* Active Upload Tasks */}
        {activeLogFilter === 'upload' && activeUploadTasks.length > 0 && (
          <div>
            <h5 className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="fa-solid fa-spinner fa-spin text-[10px]" />
              Active Uploads ({activeUploadTasks.length})
            </h5>
            <div className="space-y-2">
              {activeUploadTasks.map(task => (
                <div
                  key={task.uploadId}
                  className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-2.5 cursor-pointer hover:border-blue-500/40 transition-all"
                  onClick={() => onViewUploadTask?.(task)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <i className="fa-solid fa-upload text-[10px] text-blue-400" />
                    <span className="flex-1 truncate text-gray-200 text-[12px] font-medium" title={task.filename}>{task.filename}</span>
                    <span className="text-[11px] text-blue-400 font-semibold">{Math.round(task.progress.progress || 0)}%</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCancelUpload?.(task.uploadId); }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20 hover:border-red-500/40"
                      title="Cancel"
                    >
                      <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{task.progress.speed || 'Waiting...'}</span>
                    <span>
                      {task.progress.bytes_transferred && task.fileSize
                        ? `${formatFileSize(task.progress.bytes_transferred)} / ${formatFileSize(task.fileSize)}`
                        : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Download Tasks */}
        {activeLogFilter === 'download' && activeDownloadTasks.length > 0 && (
          <div>
            <h5 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="fa-solid fa-spinner fa-spin text-[10px]" />
              Active Downloads ({activeDownloadTasks.length})
            </h5>
            <div className="space-y-2">
              {activeDownloadTasks.map(task => (
                <div
                  key={task.downloadId}
                  className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg p-2.5 cursor-pointer hover:border-emerald-500/40 transition-all"
                  onClick={() => onViewDownloadTask?.(task)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <i className="fa-solid fa-circle-down text-[10px] text-emerald-400" />
                    <span className="flex-1 truncate text-gray-200 text-[12px] font-medium" title={task.filename}>{task.filename}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold">{Math.round(task.progress.progress || 0)}%</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onCancelDownload?.(task.downloadId); }}
                      className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20 hover:border-red-500/40"
                      title="Cancel"
                    >
                      <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{task.progress.speed || 'Waiting...'}</span>
                    <span>
                      {task.progress.bytes_transferred && task.fileSize
                        ? `${formatFileSize(task.progress.bytes_transferred)} / ${formatFileSize(task.fileSize)}`
                        : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed/Failed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="fa-solid fa-check text-[10px]" />
              {activeLogFilter === 'upload' ? 'Uploads' : 'Downloads'} ({completedTasks.length})
            </h5>
            <div className="space-y-1">
              {completedTasks.slice(0, 10).map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 p-2 rounded-lg text-[12px] ${
                    task.status === 'failed'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : task.status === 'cancelled'
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-emerald-500/10 border border-emerald-500/20'
                  }`}
                >
                  {task.type === 'upload' ? (
                    <i className={`fa-solid fa-upload text-[10px] ${task.status === 'failed' ? 'text-red-400' : task.status === 'cancelled' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  ) : (
                    <i className={`fa-solid fa-circle-down text-[10px] ${task.status === 'failed' ? 'text-red-400' : task.status === 'cancelled' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  )}
                  <span className="flex-1 truncate text-gray-300">{task.filename}</span>
                  <span className="text-[11px] text-gray-500">{formatFileSize(task.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {completedTasks.length === 0 && activeUploadTasks.length === 0 && activeDownloadTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-[12px]">
            {activeLogFilter === 'upload' ? 'No upload tasks' : 'No download tasks'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-[#1a1a1a]">
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <span>
            {activeLogFilter === 'upload' && `Upload: ${currentCount}`}
            {activeLogFilter === 'download' && `Download: ${currentCount}`}
          </span>
          <button
            onClick={() => {
              if (onClearLogsByFilter) {
                onClearLogsByFilter(activeLogFilter);
              } else {
                onClearLogs();
              }
            }}
            className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <i className="fa-solid fa-trash-can text-[10px]" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferPanel;