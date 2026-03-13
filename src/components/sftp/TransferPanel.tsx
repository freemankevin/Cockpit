import { Upload, Download, Folder, Trash2, Edit3, AlertCircle, Activity, Clock, Check, X, Pause, Play, FileText } from 'lucide-react';
import type { TransferTask, TransferLog, LogFilter } from './types';
import { formatFileSize } from './utils';

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
}

const getStatusColor = (status: TransferTask['status']) => {
  switch (status) {
    case 'completed': return 'text-emerald-500';
    case 'failed': return 'text-red-500';
    case 'transferring': return 'text-blue-500';
    case 'paused': return 'text-amber-500';
    default: return 'text-gray-400';
  }
};

const getStatusIcon = (status: TransferTask['status']) => {
  switch (status) {
    case 'completed': return <Check className="w-4 h-4" />;
    case 'failed': return <AlertCircle className="w-4 h-4" />;
    case 'transferring': return <Activity className="w-4 h-4 animate-pulse" />;
    case 'paused': return <Pause className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getStatusText = (status: TransferTask['status']) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'failed': return '失败';
    case 'transferring': return '传输中';
    case 'paused': return '已暂停';
    case 'pending': return '等待中';
    default: return '未知';
  }
};

const TransferPanel = ({
  transferTasks,
  transferLogs,
  activeLogFilter,
  onFilterChange,
  onClearLogs,
  onClearLogsByFilter,
  onPauseTask,
  onResumeTask,
  onCancelTask
}: TransferPanelProps) => {
  const activeTasks = transferTasks.filter(t =>
    t.status === 'transferring' || t.status === 'pending' || t.status === 'paused'
  );

  const completedTasks = transferTasks.filter(t =>
    t.status === 'completed' || t.status === 'failed'
  );

  // 按类型分组日志
  const uploadLogs = transferLogs.filter(log => log.type === 'upload');
  const downloadLogs = transferLogs.filter(log => log.type === 'download');
  const errorLogs = transferLogs.filter(log => log.status === 'error');
  const otherLogs = transferLogs.filter(log =>
    log.type !== 'upload' && log.type !== 'download' && log.status !== 'error'
  );

  return (
    <div className="w-80 bg-[#1e1e1e] border-l border-white/5 flex flex-col">
      {/* 标签 */}
      <div className="flex border-b border-white/5">
        {(['all', 'upload', 'download', 'error'] as LogFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-all ${
              activeLogFilter === filter
                ? 'bg-white/5 text-gray-200 border-b-2 border-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {filter === 'all' && '全部'}
            {filter === 'upload' && '上传'}
            {filter === 'download' && '下载'}
            {filter === 'error' && '错误'}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-3 space-y-2 bg-[#0d0d0d]">
        {/* 进行中的任务 */}
        {activeTasks.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              进行中 ({activeTasks.length})
            </h5>
            <div className="space-y-2">
              {activeTasks.map(task => (
                <div key={task.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {task.type === 'upload' ? (
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                        {task.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                      </span>
                      {task.status === 'transferring' && onPauseTask && (
                        <button 
                          onClick={() => onPauseTask(task.id)}
                          className="p-0.5 text-gray-400 hover:text-amber-500 transition-colors"
                          title="暂停"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                      )}
                      {task.status === 'paused' && onResumeTask && (
                        <button 
                          onClick={() => onResumeTask(task.id)}
                          className="p-0.5 text-gray-400 hover:text-emerald-500 transition-colors"
                          title="继续"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      )}
                      {onCancelTask && (
                        <button 
                          onClick={() => onCancelTask(task.id)}
                          className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="取消"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>{formatFileSize(task.transferred)} / {formatFileSize(task.size)}</span>
                      <span className="font-medium">{task.speed}</span>
                    </div>
                    {/* 进度条 */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          task.status === 'transferring' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 
                          task.status === 'paused' ? 'bg-amber-400' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">{getStatusText(task.status)}</span>
                      <span className="text-[10px] font-medium text-gray-600">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 已完成的任务 */}
        {completedTasks.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Check className="w-3 h-3" />
              已完成 ({completedTasks.length})
            </h5>
            <div className="space-y-1">
              {completedTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    task.status === 'failed' ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'
                  }`}
                >
                  {task.type === 'upload' ? (
                    <Upload className={`w-3 h-3 ${task.status === 'failed' ? 'text-red-500' : 'text-emerald-500'}`} />
                  ) : (
                    <Download className={`w-3 h-3 ${task.status === 'failed' ? 'text-red-500' : 'text-emerald-500'}`} />
                  )}
                  <span className="flex-1 truncate text-gray-700">{task.filename}</span>
                  <span className="text-[10px] text-gray-400">{formatFileSize(task.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 传输记录 - 按类型分组 */}
        <div className="space-y-4">
          {/* 上传记录 */}
          {(activeLogFilter === 'all' || activeLogFilter === 'upload') && uploadLogs.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Upload className="w-3 h-3" />
                上传记录 ({uploadLogs.length})
              </h5>
              <div className="space-y-1">
                {uploadLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 rounded-lg text-xs bg-blue-50/50 border border-blue-100/50"
                  >
                    <div className="mt-0.5 text-blue-500">
                      <Upload className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 truncate">{log.message}</div>
                      <div className="text-gray-400 text-[10px] truncate">{log.path}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.size && <span className="text-[10px] text-gray-400">{log.size}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 下载记录 */}
          {(activeLogFilter === 'all' || activeLogFilter === 'download') && downloadLogs.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Download className="w-3 h-3" />
                下载记录 ({downloadLogs.length})
              </h5>
              <div className="space-y-1">
                {downloadLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 rounded-lg text-xs bg-emerald-50/50 border border-emerald-100/50"
                  >
                    <div className="mt-0.5 text-emerald-500">
                      <Download className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 truncate">{log.message}</div>
                      <div className="text-gray-400 text-[10px] truncate">{log.path}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.size && <span className="text-[10px] text-gray-400">{log.size}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 错误记录 */}
          {(activeLogFilter === 'all' || activeLogFilter === 'error') && errorLogs.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                错误记录 ({errorLogs.length})
              </h5>
              <div className="space-y-1">
                {errorLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 rounded-lg text-xs bg-red-50 border border-red-100"
                  >
                    <div className="mt-0.5 text-red-500">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 truncate">{log.message}</div>
                      <div className="text-gray-400 text-[10px] truncate">{log.path}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 其他记录 */}
          {activeLogFilter === 'all' && otherLogs.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                其他记录 ({otherLogs.length})
              </h5>
              <div className="space-y-1">
                {otherLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 p-2 rounded-lg text-xs bg-white border border-gray-100"
                  >
                    <div className="mt-0.5 text-gray-400">
                      {log.type === 'mkdir' && <Folder className="w-3 h-3" />}
                      {log.type === 'delete' && <Trash2 className="w-3 h-3" />}
                      {log.type === 'rename' && <Edit3 className="w-3 h-3" />}
                      {log.type === 'info' && <Activity className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 truncate">{log.message}</div>
                      <div className="text-gray-400 text-[10px] truncate">{log.path}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.size && <span className="text-[10px] text-gray-400">{log.size}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {transferLogs.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">暂无记录</div>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div className="p-3 border-t border-gray-200/60 bg-white/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {activeLogFilter === 'all' && `总任务: ${transferTasks.length}`}
            {activeLogFilter === 'upload' && `上传记录: ${uploadLogs.length}`}
            {activeLogFilter === 'download' && `下载记录: ${downloadLogs.length}`}
            {activeLogFilter === 'error' && `错误记录: ${errorLogs.length}`}
          </span>
          <button
            onClick={() => {
              if (onClearLogsByFilter) {
                onClearLogsByFilter(activeLogFilter);
              } else {
                onClearLogs();
              }
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            清空记录
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferPanel;
