import { Download, Edit3, Trash2, Link2 } from 'lucide-react';
import FileIcon from './FileIcon';
import type { SFTPFile } from '@/services/api';
import type { ViewMode } from './types';

interface FileListProps {
  files: SFTPFile[];
  loading: boolean;
  viewMode: ViewMode;
  selectedFiles: Set<string>;
  onFileClick: (file: SFTPFile) => void;
  onFileSelect: (path: string) => void;
  onSelectAll: (selected: boolean) => void;
  onDownload: (file: SFTPFile) => void;
  onRename: (file: SFTPFile) => void;
  onDelete: (file: SFTPFile) => void;
}

const FileList = ({
  files,
  loading,
  viewMode,
  selectedFiles,
  onFileClick,
  onFileSelect,
  onSelectAll,
  onDownload,
  onRename,
  onDelete
}: FileListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d0d0d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
          <span className="text-sm text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <table className="w-full bg-[#0d0d0d]">
        <thead className="bg-[#1a1a1a] sticky top-0 z-10">
          <tr className="text-left text-xs font-medium text-gray-400 border-b border-white/10">
            <th className="px-4 py-2.5 w-10">
              <input
                type="checkbox"
                checked={selectedFiles.size === files.length && files.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-600 bg-transparent text-blue-400 focus:ring-blue-500/50"
              />
            </th>
            <th className="px-4 py-2.5">名称</th>
            <th className="px-4 py-2.5 w-28">大小</th>
            <th className="px-4 py-2.5 w-32 whitespace-nowrap">修改时间</th>
            <th className="px-4 py-2.5 w-24">权限</th>
            <th className="px-4 py-2.5 w-20 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {files.map((file) => (
            <tr
              key={file.path}
              onClick={() => onFileClick(file)}
              className={`hover:bg-white/5 cursor-pointer group transition-colors ${
                selectedFiles.has(file.path) ? 'bg-blue-500/10' : ''
              }`}
            >
              <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => onFileSelect(file.path)}
                  className="rounded border-gray-600 bg-transparent text-blue-400 focus:ring-blue-500/50"
                />
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <FileIcon file={file} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-200 font-medium">{file.name}</span>
                    {file.is_link && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-500/20">
                        <Link2 className="w-3 h-3" />
                        链接
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-400">
                {file.is_dir ? '—' : file.size_formatted}
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-400 whitespace-nowrap">
                {file.modified_time_formatted}
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">
                {file.permissions}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!file.is_dir && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownload(file); }}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all"
                      title="下载"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onRename(file); }}
                    className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all"
                    title="重命名"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Grid view
  return (
    <div className="p-4 grid grid-cols-6 gap-3 bg-[#0d0d0d]">
      {files.map((file) => (
        <div
          key={file.path}
          onClick={() => onFileClick(file)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
            selectedFiles.has(file.path)
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="relative">
            <FileIcon file={file} size="lg" />
            {file.is_link && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-[#0d0d0d]">
                <Link2 className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <span className="text-xs text-gray-300 text-center truncate w-full">{file.name}</span>
          <span className="text-[10px] text-gray-500">
            {file.is_dir ? '文件夹' : file.size_formatted}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FileList;
