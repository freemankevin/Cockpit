import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { SFTPFile } from '@/services/api';
import { sftpApi } from '@/services/api';
import { useToast } from '@/hooks/useToast';

import type { SFTPModalProps, ViewMode, LogFilter } from './sftp/types';
import { useTransferManager } from './sftp/hooks/useTransferManager';
import { useSFTP } from './sftp/hooks/useSFTP';
import { useFileOperations } from './sftp/hooks/useFileOperations';
import { formatFileSize } from './sftp/utils';

import SFTPHeader from './sftp/SFTPHeader';
import SFTPToolbar from './sftp/SFTPToolbar';
import Sidebar from './sftp/Sidebar';
import FileList from './sftp/FileList';
import TransferPanel from './sftp/TransferPanel';
import StatusBar from './sftp/StatusBar';
import { NewFolderDialog, RenameDialog, FileEditor, LoadingOverlay, ErrorOverlay } from './sftp/Dialogs';

// Mac Terminal 风格窗口控制按钮
const WindowControls = ({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized
}: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}) => (
  <div className="flex items-center gap-2">
    {/* 关闭按钮 - 红色 */}
    <button
      onClick={onClose}
      className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-all hover:scale-110 flex items-center justify-center group"
      title="关闭"
    >
      <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold">×</span>
    </button>
    {/* 最小化按钮 - 黄色 */}
    <button
      onClick={onMinimize}
      className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-all hover:scale-110 flex items-center justify-center group"
      title="最小化"
    >
      <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold">−</span>
    </button>
    {/* 最大化/恢复按钮 - 绿色 */}
    <button
      onClick={onMaximize}
      className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-all hover:scale-110 flex items-center justify-center group"
      title={isMaximized ? "恢复" : "最大化"}
    >
      <span className="text-[8px] text-black/60 opacity-0 group-hover:opacity-100 font-bold">{isMaximized ? '⤢' : '⤢'}</span>
    </button>
  </div>
);

const SFTPModal = ({ host, onClose }: SFTPModalProps) => {
  const [pathInputValue, setPathInputValue] = useState('/');
  const [isPathEditing, setIsPathEditing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [activeLogFilter, setActiveLogFilter] = useState<LogFilter>('all');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SFTPFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showFileEditor, setShowFileEditor] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { success, error: showError } = useToast();
  
  const transfer = useTransferManager();
  const sftp = useSFTP({ hostId: host.id, onLog: transfer.addTransferLog });
  const fileOps = useFileOperations({
    hostId: host.id, currentPath: sftp.currentPath,
    onLog: transfer.addTransferLog, onSuccess: success, onError: showError, onRefresh: sftp.refresh
  });

  // 超时自动断开配置（30分钟）
  const TIMEOUT_DURATION = 30 * 60 * 1000; // 30分钟
  const WARNING_DURATION = 5 * 60 * 1000; // 提前5分钟警告

  // 更新活动时间
  const updateActivityTime = useCallback(() => {
    setLastActivityTime(Date.now());
    setShowTimeoutWarning(false);
  }, []);

  // 超时检查
  useEffect(() => {
    const checkTimeout = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivityTime;
      
      if (inactiveTime >= TIMEOUT_DURATION) {
        // 超时断开
        handleTimeoutDisconnect();
      } else if (inactiveTime >= TIMEOUT_DURATION - WARNING_DURATION) {
        // 显示警告
        setShowTimeoutWarning(true);
      }
    };

    timeoutRef.current = setInterval(checkTimeout, 60000); // 每分钟检查一次
    
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [lastActivityTime]);

  // 超时断开处理
  const handleTimeoutDisconnect = useCallback(async () => {
    try {
      await sftpApi.disconnect(host.id);
      showError('连接超时', '由于长时间未操作，连接已自动断开');
      onClose();
    } catch (err) {
      console.error('断开连接失败:', err);
      onClose();
    }
  }, [host.id, onClose, showError]);

  // 监听用户活动
  useEffect(() => {
    const handleActivity = () => updateActivityTime();
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [updateActivityTime]);

  const handlePathSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newPath = pathInputValue.trim();
      if (newPath && newPath !== sftp.currentPath) sftp.navigateTo(newPath);
      setIsPathEditing(false);
    } else if (e.key === 'Escape') {
      setPathInputValue(sftp.currentPath);
      setIsPathEditing(false);
    }
  }, [pathInputValue, sftp.currentPath, sftp.navigateTo]);

  const copyPathToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sftp.currentPath);
      success('已复制', `路径已复制到剪贴板: ${sftp.currentPath}`);
      transfer.addTransferLog('info', `复制路径: ${sftp.currentPath}`, sftp.currentPath, 'success');
    } catch { showError('复制失败', '无法复制路径到剪贴板'); }
  }, [sftp.currentPath, success, showError, transfer.addTransferLog]);

  const handleFileClick = useCallback(async (file: SFTPFile) => {
    updateActivityTime();
    if (file.is_dir) { sftp.navigateTo(file.path); }
    else { const content = await fileOps.readFile(file); if (content !== null) setShowFileEditor(true); }
  }, [sftp.navigateTo, fileOps.readFile, updateActivityTime]);

  const toggleFileSelection = useCallback((path: string) => {
    updateActivityTime();
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) newSelected.delete(path); else newSelected.add(path);
    setSelectedFiles(newSelected);
  }, [selectedFiles, updateActivityTime]);

  const filteredFiles = useMemo(() => 
    sftp.files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [sftp.files, searchQuery]
  );

  const handleSelectAll = useCallback((selected: boolean) => {
    updateActivityTime();
    setSelectedFiles(selected ? new Set(filteredFiles.map(f => f.path)) : new Set());
  }, [filteredFiles, updateActivityTime]);

  const handleUpload = () => {
    updateActivityTime();
    fileInputRef.current?.click();
  };

  const handleUploadFolder = () => {
    updateActivityTime();
    folderInputRef.current?.click();
  };

  const handleUploadFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivityTime();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 处理所有选中的文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const taskId = transfer.createTransferTask('upload', file.name, `${sftp.currentPath}/${file.name}`, file.size);
      transfer.updateTransferTask(taskId, { status: 'transferring' });
      const stopProgress = transfer.simulateTransferProgress(taskId, file.size);
      try {
        const response = await sftpApi.uploadFile(host.id, sftp.currentPath, file);
        stopProgress();
        if (response.success) {
          transfer.completeTransferTask(taskId, true);
          success('上传成功', `${file.name} 已上传`);
          transfer.addTransferLog('upload', `上传文件: ${file.name}`, `${sftp.currentPath}/${file.name}`, 'success', formatFileSize(file.size));
        } else {
          transfer.completeTransferTask(taskId, false, response.message);
          showError('上传失败', response.message || '无法上传文件');
        }
      } catch (err) {
        transfer.completeTransferTask(taskId, false, (err as Error).message);
        showError('上传失败', (err as Error).message);
      }
    }
    sftp.refresh();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActivityTime();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 获取文件夹名称（从第一个文件的路径推断）
    const firstFile = files[0];
    const relativePath = firstFile.webkitRelativePath || '';
    const folderName = relativePath.split('/')[0] || 'folder';

    // 创建目标文件夹路径
    const targetFolderPath = `${sftp.currentPath}/${folderName}`;

    // 先创建文件夹
    try {
      await sftpApi.createDirectory(host.id, targetFolderPath);
      transfer.addTransferLog('mkdir', `创建文件夹: ${folderName}`, targetFolderPath, 'success');
    } catch (err) {
      // 文件夹可能已存在，继续上传
    }

    // 处理文件夹中的所有文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      const targetPath = `${sftp.currentPath}/${relativePath}`;
      const targetDir = targetPath.substring(0, targetPath.lastIndexOf('/'));

      const taskId = transfer.createTransferTask('upload', file.name, targetPath, file.size);
      transfer.updateTransferTask(taskId, { status: 'transferring' });
      const stopProgress = transfer.simulateTransferProgress(taskId, file.size);
      try {
        const response = await sftpApi.uploadFile(host.id, targetDir, file);
        stopProgress();
        if (response.success) {
          transfer.completeTransferTask(taskId, true);
          transfer.addTransferLog('upload', `上传文件: ${relativePath}`, targetPath, 'success', formatFileSize(file.size));
        } else {
          transfer.completeTransferTask(taskId, false, response.message);
        }
      } catch (err) {
        transfer.completeTransferTask(taskId, false, (err as Error).message);
      }
    }

    success('上传完成', `文件夹 "${folderName}" 已上传`);
    sftp.refresh();
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleDownload = async (file: SFTPFile) => {
    updateActivityTime();
    const taskId = transfer.createTransferTask('download', file.name, file.path, file.size);
    transfer.updateTransferTask(taskId, { status: 'transferring' });
    const stopProgress = transfer.simulateTransferProgress(taskId, file.size);
    try {
      const blob = await sftpApi.downloadFile(host.id, file.path);
      stopProgress();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
      transfer.completeTransferTask(taskId, true);
      success('下载成功', `${file.name} 已下载`);
      transfer.addTransferLog('download', `下载文件: ${file.name}`, file.path, 'success', file.size_formatted);
    } catch (err) {
      transfer.completeTransferTask(taskId, false, (err as Error).message);
      showError('下载失败', (err as Error).message);
    }
  };

  const handleCreateFolder = async () => {
    updateActivityTime();
    if (await fileOps.createFolder(newFolderName)) { setShowNewFolderDialog(false); setNewFolderName(''); }
  };

  const handleRename = async () => {
    updateActivityTime();
    if (!renameTarget) return;
    if (await fileOps.renameFile(renameTarget, newFileName)) {
      setShowRenameDialog(false); setRenameTarget(null); setNewFileName('');
    }
  };

  const handleSaveAndClose = async () => {
    updateActivityTime();
    if (await fileOps.saveFile()) { setShowFileEditor(false); fileOps.closeEditor(); }
  };

  // 窗口控制
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    updateActivityTime();
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    updateActivityTime();
  };

  const handleClose = () => {
    updateActivityTime();
    onClose();
  };

  const activeTransfers = transfer.transferTasks.filter(t => t.status === 'transferring').length;

  // 如果最小化，显示浮动按钮
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg shadow-lg hover:bg-[#2a2a2a] transition-all border border-white/10"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-medium">SFTP: {host.address}</span>
          {activeTransfers > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {activeTransfers}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay isOpen={sftp.connecting} hostName={host.name} />
      <ErrorOverlay isOpen={!!sftp.error && !sftp.files.length} error={sftp.error} onClose={onClose} />

      {/* 超时警告 */}
      {showTimeoutWarning && (
        <div className="fixed top-4 right-4 z-[60] bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 text-lg">⏰</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900">连接即将超时</h4>
              <p className="text-xs text-amber-700 mt-1">
                由于长时间未操作，连接将在5分钟后自动断开。请进行操作以保持连接。
              </p>
              <button
                onClick={() => {
                  updateActivityTime();
                  setShowTimeoutWarning(false);
                }}
                className="mt-2 px-3 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600 transition-colors"
              >
                保持连接
              </button>
            </div>
          </div>
        </div>
      )}

      {!sftp.connecting && (!sftp.error || sftp.files.length > 0) && (
        <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in ${isMaximized ? 'p-0' : 'p-4'}`}>
          {/* Mac Terminal 风格窗口 - 暗色主题 */}
          <div
            className={`bg-[#1a1a1a] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/10 transition-all duration-300 ${
              isMaximized ? 'fixed inset-4 w-auto h-auto max-w-none rounded-2xl' : 'w-full max-w-5xl h-[600px]'
            }`}
            style={{
              boxShadow: isMaximized
                ? '0 0 0 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 100px -20px rgba(0,0,0,0.3)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Mac 风格标题栏 - 暗色 */}
            <div className="h-10 bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] border-b border-white/5 flex items-center px-4 gap-4 select-none">
              {/* 窗口控制按钮 */}
              <WindowControls
                onClose={handleClose}
                onMinimize={handleMinimize}
                onMaximize={handleMaximize}
                isMaximized={isMaximized}
              />

              {/* 标题 */}
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-gray-200">{host.address}</span>
              </div>

              {/* 状态指示器 */}
              <div className="flex items-center gap-2">
                {activeTransfers > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-xs text-blue-300">{activeTransfers}</span>
                  </div>
                )}
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* 工具栏 - 暗色 */}
            <div className="h-12 bg-[#252525] border-b border-white/5 flex items-center px-4 gap-3">
              <SFTPHeader
                currentPath={sftp.currentPath} pathInputValue={isPathEditing ? pathInputValue : sftp.currentPath}
                isPathEditing={isPathEditing} historyIndex={sftp.historyIndex} pathHistory={sftp.pathHistory}
                viewMode={viewMode} searchQuery={searchQuery} isSearchFocused={isSearchFocused}
                showTransferPanel={showTransferPanel} activeTransfers={activeTransfers} diskUsage={sftp.diskUsage}
                onNavigate={sftp.navigateTo} onGoBack={sftp.goBack} onGoForward={sftp.goForward} onGoUp={sftp.goUp}
                onPathInputChange={setPathInputValue} onPathSubmit={handlePathSubmit}
                onPathEditStart={() => setIsPathEditing(true)} onPathEditCancel={() => setIsPathEditing(false)}
                onCopyPath={copyPathToClipboard} onViewModeChange={setViewMode} onSearchChange={setSearchQuery}
                onSearchFocus={setIsSearchFocused} onToggleTransferPanel={() => setShowTransferPanel(!showTransferPanel)}
              />
            </div>
            
            <SFTPToolbar showSidebar={showSidebar} onRefresh={sftp.refresh} onToggleSidebar={() => setShowSidebar(!showSidebar)}
              onNewFolder={() => setShowNewFolderDialog(true)} onUpload={handleUpload} onUploadFolder={handleUploadFolder} />
            
            <div className="flex-1 overflow-hidden flex">
              {showSidebar && <Sidebar currentPath={sftp.currentPath} hostAddress={host.address}
                fileCount={filteredFiles.length} onNavigate={sftp.navigateTo} />}
              <div className="flex-1 overflow-auto bg-[#0d0d0d]">
                <FileList files={filteredFiles} loading={sftp.loading} viewMode={viewMode} selectedFiles={selectedFiles}
                  onFileClick={handleFileClick} onFileSelect={toggleFileSelection} onSelectAll={handleSelectAll}
                  onDownload={handleDownload} onRename={(file) => { setRenameTarget(file); setNewFileName(file.name); setShowRenameDialog(true); }}
                  onDelete={fileOps.deleteFile} />
              </div>
              {showTransferPanel && <TransferPanel transferTasks={transfer.transferTasks} transferLogs={transfer.transferLogs}
                activeLogFilter={activeLogFilter} onFilterChange={setActiveLogFilter} onClearLogs={transfer.clearLogs}
                onClearLogsByFilter={transfer.clearLogsByFilter}
                onPauseTask={transfer.pauseTransferTask} onResumeTask={(taskId) => {
                  const task = transfer.transferTasks.find(t => t.id === taskId);
                  if (task) transfer.resumeTransferTask(taskId, task.size);
                }} onCancelTask={transfer.cancelTransferTask} />}
            </div>
            
            <StatusBar
              fileCount={filteredFiles.length}
              selectedCount={selectedFiles.size}
              searchQuery={searchQuery}
              activeTransfers={activeTransfers}
              hostAddress={host.address}
            />
          </div>
        </div>
      )}
      
      {/* 文件上传输入 */}
      <input ref={fileInputRef} type="file" multiple onChange={handleUploadFileSelect} className="hidden" id="file-upload-input" />
      {/* 文件夹上传输入 */}
      <input ref={folderInputRef} type="file" {...{ webkitdirectory: "", directory: "" }} multiple onChange={handleUploadFolderSelect} className="hidden" id="folder-upload-input" />
      <NewFolderDialog isOpen={showNewFolderDialog} folderName={newFolderName} onNameChange={setNewFolderName}
        onCreate={handleCreateFolder} onCancel={() => { setShowNewFolderDialog(false); setNewFolderName(''); }} />
      <RenameDialog isOpen={showRenameDialog} target={renameTarget} newName={newFileName} onNameChange={setNewFileName}
        onRename={handleRename} onCancel={() => { setShowRenameDialog(false); setRenameTarget(null); setNewFileName(''); }} />
      <FileEditor isOpen={showFileEditor} file={fileOps.editingFile} content={fileOps.fileContent} saving={fileOps.saving}
        onContentChange={fileOps.setFileContent} onSave={handleSaveAndClose} onClose={() => { setShowFileEditor(false); fileOps.closeEditor(); }} />
    </>
  );
};

export default SFTPModal;
