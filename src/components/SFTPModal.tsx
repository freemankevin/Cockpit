import { useState, useEffect, useRef } from 'react';
import {
  X, Folder, File, ChevronLeft, ChevronRight, Home,
  RefreshCw, Upload, Download, Trash2, Edit3, Plus,
  FolderOpen, FileText, HardDrive, ArrowUp, Check, AlertCircle
} from 'lucide-react';
import type { SSHHost } from '@/types';
import { sftpApi, type SFTPFile } from '@/services/api';
import { useToast } from '@/hooks/useToast';

interface SFTPModalProps {
  host: SSHHost;
  onClose: () => void;
}

const SFTPModal = ({ host, onClose }: SFTPModalProps) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<SFTPFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [pathHistory, setPathHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SFTPFile | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showFileEditor, setShowFileEditor] = useState(false);
  const [editingFile, setEditingFile] = useState<SFTPFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [diskUsage, setDiskUsage] = useState<{size: string; used: string; available: string; use_percentage: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  // 连接 SFTP
  useEffect(() => {
    const connect = async () => {
      try {
        setConnecting(true);
        console.log('[SFTPModal] 开始连接 SFTP, host_id:', host.id);
        const response = await sftpApi.connect(host.id);
        console.log('[SFTPModal] 连接响应:', response);
        if (response.success) {
          await loadDirectory('/');
          await loadDiskUsage();
        } else {
          setError('SFTP 连接失败: ' + (response.message || '未知错误'));
        }
      } catch (err) {
        console.error('[SFTPModal] 连接错误:', err);
        setError('SFTP 连接错误: ' + (err as Error).message);
      } finally {
        setConnecting(false);
      }
    };

    connect();

    // 清理函数
    return () => {
      sftpApi.disconnect(host.id).catch(console.error);
    };
  }, [host.id]);

  // 加载目录
  const loadDirectory = async (path: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await sftpApi.listDirectory(host.id, path);
      if (response.success) {
        setFiles(response.files);
        setCurrentPath(response.path);
      } else {
        setError(response.error || '加载目录失败');
      }
    } catch (err) {
      setError('加载目录错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 加载磁盘使用情况
  const loadDiskUsage = async () => {
    try {
      const response = await sftpApi.getDiskUsage(host.id, '/');
      if (response.success) {
        setDiskUsage({
          size: response.size,
          used: response.used,
          available: response.available,
          use_percentage: response.use_percentage
        });
      }
    } catch (err) {
      console.error('加载磁盘使用情况失败:', err);
    }
  };

  // 导航到目录
  const navigateTo = (path: string) => {
    // 添加到历史
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(path);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    loadDirectory(path);
  };

  // 返回上级
  const goUp = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    navigateTo(parentPath);
  };

  // 后退
  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      loadDirectory(pathHistory[historyIndex - 1]);
    }
  };

  // 前进
  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      loadDirectory(pathHistory[historyIndex + 1]);
    }
  };

  // 刷新
  const refresh = () => {
    loadDirectory(currentPath);
    loadDiskUsage();
  };

  // 处理文件点击
  const handleFileClick = (file: SFTPFile) => {
    if (file.is_dir) {
      navigateTo(file.path);
    } else {
      // 预览或编辑文件
      handleEditFile(file);
    }
  };


  // 创建目录
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const newPath = `${currentPath}/${newFolderName}`.replace(/\/+/g, '/');
      const response = await sftpApi.createDirectory(host.id, newPath);
      if (response.success) {
        success('创建成功', '目录已创建');
        setShowNewFolderDialog(false);
        setNewFolderName('');
        refresh();
      } else {
        showError('创建失败', response.message || '无法创建目录');
      }
    } catch (err) {
      showError('创建失败', (err as Error).message);
    }
  };

  // 删除文件/目录
  const handleDelete = async (file: SFTPFile) => {
    if (!confirm(`确定要删除 ${file.name} 吗？`)) return;
    try {
      const response = await sftpApi.remove(host.id, file.path, file.is_dir);
      if (response.success) {
        success('删除成功', `${file.name} 已删除`);
        refresh();
      } else {
        showError('删除失败', response.message || '无法删除');
      }
    } catch (err) {
      showError('删除失败', (err as Error).message);
    }
  };

  // 重命名
  const handleRename = async () => {
    if (!renameTarget || !newFileName.trim()) return;
    try {
      const parentPath = currentPath === '/' ? '' : currentPath;
      const newPath = `${parentPath}/${newFileName}`.replace(/\/+/g, '/');
      const response = await sftpApi.rename(host.id, renameTarget.path, newPath);
      if (response.success) {
        success('重命名成功', `${renameTarget.name} -> ${newFileName}`);
        setShowRenameDialog(false);
        setRenameTarget(null);
        setNewFileName('');
        refresh();
      } else {
        showError('重命名失败', response.message || '无法重命名');
      }
    } catch (err) {
      showError('重命名失败', (err as Error).message);
    }
  };

  // 编辑文件
  const handleEditFile = async (file: SFTPFile) => {
    // 只编辑文本文件
    const textExtensions = ['.txt', '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.py', '.sh', '.yml', '.yaml', '.conf', '.cfg', '.ini', '.log', '.html', '.css', '.xml'];
    const isTextFile = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isTextFile) {
      // 非文本文件直接下载
      handleDownload(file);
      return;
    }

    try {
      setLoading(true);
      const response = await sftpApi.readFile(host.id, file.path);
      if (response.success) {
        setEditingFile(file);
        setFileContent(response.content);
        setShowFileEditor(true);
      } else {
        showError('读取失败', response.error || '无法读取文件');
      }
    } catch (err) {
      showError('读取失败', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 保存文件
  const handleSaveFile = async () => {
    if (!editingFile) return;
    try {
      setSaving(true);
      const response = await sftpApi.writeFile(host.id, editingFile.path, fileContent);
      if (response.success) {
        success('保存成功', '文件已保存');
        setShowFileEditor(false);
        setEditingFile(null);
        refresh();
      } else {
        showError('保存失败', response.message || '无法保存文件');
      }
    } catch (err) {
      showError('保存失败', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 上传文件
  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const response = await sftpApi.uploadFile(host.id, currentPath, file);
      if (response.success) {
        success('上传成功', `${file.name} 已上传`);
        refresh();
      } else {
        showError('上传失败', response.message || '无法上传文件');
      }
    } catch (err) {
      showError('上传失败', (err as Error).message);
    } finally {
      setLoading(false);
      // 重置 input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 下载文件
  const handleDownload = async (file: SFTPFile) => {
    try {
      const blob = await sftpApi.downloadFile(host.id, file.path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success('下载成功', `${file.name} 已下载`);
    } catch (err) {
      showError('下载失败', (err as Error).message);
    }
  };

  // 获取文件图标
  const getFileIcon = (file: SFTPFile) => {
    if (file.is_dir) return <Folder className="w-5 h-5 text-amber-500" />;
    if (file.name.endsWith('.js') || file.name.endsWith('.ts')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (file.name.endsWith('.json')) return <FileText className="w-5 h-5 text-green-500" />;
    if (file.name.endsWith('.md')) return <FileText className="w-5 h-5 text-purple-500" />;
    if (file.name.endsWith('.py')) return <FileText className="w-5 h-5 text-yellow-500" />;
    if (file.name.endsWith('.sh')) return <FileText className="w-5 h-5 text-gray-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  if (connecting) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-700">正在连接 SFTP...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !files.length) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <span className="text-lg font-semibold">连接失败</span>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[80vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">SFTP 文件管理</h3>
              <p className="text-xs text-gray-500">{host.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 磁盘使用情况 */}
            {diskUsage && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs">
                <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">{diskUsage.use_percentage}</span>
                <span className="text-gray-400">({diskUsage.used} / {diskUsage.size})</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={historyIndex === 0}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goForward}
              disabled={historyIndex >= pathHistory.length - 1}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={goUp}
              disabled={currentPath === '/'}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-2" />
            <button
              onClick={refresh}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewFolderDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建文件夹
            </button>
            <button
              onClick={handleUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              上传
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Path Bar */}
        <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4">
          <div className="flex items-center gap-1 text-sm text-gray-600 overflow-x-auto">
            <button
              onClick={() => navigateTo('/')}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Home className="w-4 h-4" />
            </button>
            {currentPath.split('/').filter(Boolean).map((part, index, arr) => {
              const path = '/' + arr.slice(0, index + 1).join('/');
              return (
                <span key={index} className="flex items-center">
                  <span className="text-gray-400 mx-1">/</span>
                  <button
                    onClick={() => navigateTo(path)}
                    className="hover:bg-gray-200 px-1.5 py-0.5 rounded whitespace-nowrap"
                  >
                    {part}
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === files.length && files.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(new Set(files.map(f => f.path)));
                        } else {
                          setSelectedFiles(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-2">名称</th>
                  <th className="px-4 py-2 w-24">大小</th>
                  <th className="px-4 py-2 w-32">修改时间</th>
                  <th className="px-4 py-2 w-20">权限</th>
                  <th className="px-4 py-2 w-16">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {files.map((file) => (
                  <tr
                    key={file.path}
                    onClick={() => handleFileClick(file)}
                    className={`hover:bg-gray-50 cursor-pointer group ${selectedFiles.has(file.path) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={() => {
                          const newSelected = new Set(selectedFiles);
                          if (newSelected.has(file.path)) {
                            newSelected.delete(file.path);
                          } else {
                            newSelected.add(file.path);
                          }
                          setSelectedFiles(newSelected);
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="text-sm text-gray-900">{file.name}</span>
                        {file.is_link && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">链接</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">
                      {file.is_dir ? '-' : file.size_formatted}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">
                      {file.modified_time_formatted}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">
                      {file.permissions}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!file.is_dir && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setRenameTarget(file); setNewFileName(file.name); setShowRenameDialog(true); }}
                          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="重命名"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500">
          <span>{files.length} 个项目</span>
          <span>{selectedFiles.size} 个已选择</span>
        </div>
      </div>

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-80 shadow-2xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">新建文件夹</h4>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="文件夹名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowNewFolderDialog(false); setNewFolderName(''); }}
                className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {showRenameDialog && renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 w-80 shadow-2xl">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">重命名</h4>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="新名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowRenameDialog(false); setRenameTarget(null); setNewFileName(''); }}
                className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRename}
                disabled={!newFileName.trim() || newFileName === renameTarget.name}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                重命名
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Editor */}
      {showFileEditor && editingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col">
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">{editingFile.name}</span>
                <span className="text-xs text-gray-500">({editingFile.size_formatted})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFile}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  保存
                </button>
                <button
                  onClick={() => { setShowFileEditor(false); setEditingFile(null); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="flex-1 p-4 font-mono text-sm text-gray-800 bg-gray-50 resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SFTPModal;
