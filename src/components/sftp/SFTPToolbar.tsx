import { RefreshCw, PanelLeft, FolderPlus, Upload, FolderUp } from 'lucide-react';

interface SFTPToolbarProps {
  showSidebar: boolean;
  onRefresh: () => void;
  onToggleSidebar: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onUploadFolder?: () => void;
}

const SFTPToolbar = ({
  showSidebar,
  onRefresh,
  onToggleSidebar,
  onNewFolder,
  onUpload,
  onUploadFolder
}: SFTPToolbarProps) => (
  <div className="h-10 bg-[#1e1e1e] border-b border-white/5 flex items-center px-4 gap-2">
    {/* 左侧工具 */}
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleSidebar}
        className={`p-2 rounded-md transition-all ${showSidebar ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/10'}`}
        title={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        onClick={onRefresh}
        className="p-2 text-gray-400 hover:bg-white/10 rounded-md transition-all"
        title="刷新"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>

    {/* 中间分隔 */}
    <div className="flex-1" />

    {/* 右侧操作 */}
    <div className="flex items-center gap-1">
      <button
        onClick={onNewFolder}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 rounded-md transition-all"
      >
        <FolderPlus className="w-4 h-4" />
        <span>新建文件夹</span>
      </button>

      <div className="flex items-center bg-blue-500/20 rounded-md overflow-hidden">
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-500/30 transition-all border-r border-blue-500/30"
          title="上传文件"
        >
          <Upload className="w-4 h-4" />
          <span>上传文件</span>
        </button>
        {onUploadFolder && (
          <button
            onClick={onUploadFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-500/30 transition-all"
            title="上传文件夹"
          >
            <FolderUp className="w-4 h-4" />
            <span>上传文件夹</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

export default SFTPToolbar;
