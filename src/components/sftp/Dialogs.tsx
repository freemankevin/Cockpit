import { Folder, Edit3, FileText, Check, RefreshCw, X } from 'lucide-react';
import type { SFTPFile } from '@/services/api';

interface NewFolderDialogProps {
  isOpen: boolean;
  folderName: string;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export const NewFolderDialog = ({
  isOpen,
  folderName,
  onNameChange,
  onCreate,
  onCancel
}: NewFolderDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl p-6 w-96 shadow-2xl border border-white/50 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Folder className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">新建文件夹</h4>
            <p className="text-xs text-gray-500">在当前目录创建新文件夹</p>
          </div>
        </div>
        <input
          type="text"
          value={folderName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="文件夹名称"
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
        />
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onCreate}
            disabled={!folderName.trim()}
            className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium shadow-sm shadow-blue-500/20"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
};

interface RenameDialogProps {
  isOpen: boolean;
  target: SFTPFile | null;
  newName: string;
  onNameChange: (name: string) => void;
  onRename: () => void;
  onCancel: () => void;
}

export const RenameDialog = ({
  isOpen,
  target,
  newName,
  onNameChange,
  onRename,
  onCancel
}: RenameDialogProps) => {
  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl p-6 w-96 shadow-2xl border border-white/50 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">重命名</h4>
            <p className="text-xs text-gray-500">修改文件或文件夹名称</p>
          </div>
        </div>
        <input
          type="text"
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="新名称"
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onRename()}
        />
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onRename}
            disabled={!newName.trim() || newName === target.name}
            className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium shadow-sm shadow-blue-500/20"
          >
            重命名
          </button>
        </div>
      </div>
    </div>
  );
};

interface FileEditorProps {
  isOpen: boolean;
  file: SFTPFile | null;
  content: string;
  saving: boolean;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const FileEditor = ({
  isOpen,
  file,
  content,
  saving,
  onContentChange,
  onSave,
  onClose
}: FileEditorProps) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col border border-gray-200/50 animate-scale-in overflow-hidden">
        {/* 编辑器标题栏 */}
        <div className="h-12 bg-gradient-to-b from-gray-50 to-gray-100/80 border-b border-gray-200/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors"
              />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="h-4 w-px bg-gray-300 mx-2" />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-900 text-sm">{file.name}</span>
              <span className="text-xs text-gray-400">({file.size_formatted})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm transition-all shadow-sm shadow-blue-500/20"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              保存
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="flex-1 p-4 font-mono text-sm text-gray-800 bg-white resize-none focus:outline-none leading-relaxed"
          spellCheck={false}
          placeholder="文件内容..."
        />
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isOpen: boolean;
  hostName: string;
}

export const LoadingOverlay = ({ isOpen, hostName }: LoadingOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/50 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
          <div>
            <span className="text-gray-900 font-semibold text-lg">正在连接 SFTP...</span>
            <p className="text-sm text-gray-500 mt-0.5">{hostName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ErrorOverlayProps {
  isOpen: boolean;
  error: string;
  onClose: () => void;
}

export const ErrorOverlay = ({ isOpen, error, onClose }: ErrorOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl max-w-md border border-white/50 animate-scale-in">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <X className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-semibold">连接失败</span>
            <p className="text-sm text-gray-500">无法建立 SFTP 连接</p>
          </div>
        </div>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          关闭
        </button>
      </div>
    </div>
  );
};
