import { useRef, useState, useEffect } from 'react';
import { HardDrive, Copy, ChevronLeft, ChevronRight, ArrowUp, Edit2, Check } from 'lucide-react';

interface PathBarProps {
  currentPath: string;
  pathInputValue: string;
  isPathEditing: boolean;
  historyIndex: number;
  pathHistory: string[];
  onNavigate: (path: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoUp: () => void;
  onPathInputChange: (value: string) => void;
  onPathSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPathEditStart: () => void;
  onPathEditCancel: () => void;
  onCopyPath: () => void;
}

const PathBar = ({
  currentPath,
  pathInputValue,
  isPathEditing,
  historyIndex,
  pathHistory,
  onNavigate,
  onGoBack,
  onGoForward,
  onGoUp,
  onPathInputChange,
  onPathSubmit,
  onPathEditStart,
  onPathEditCancel,
  onCopyPath
}: PathBarProps) => {
  const pathInputRef = useRef<HTMLInputElement>(null);
  const [showPathDropdown, setShowPathDropdown] = useState(false);

  const pathParts = currentPath === '/' 
    ? [] 
    : currentPath.split('/').filter(Boolean);

  // 常用路径快捷方式
  const quickPaths = [
    { name: '根目录', path: '/' },
    { name: 'home', path: '/home' },
    { name: 'etc', path: '/etc' },
    { name: 'var', path: '/var' },
    { name: 'tmp', path: '/tmp' },
    { name: 'usr', path: '/usr' },
  ];

  useEffect(() => {
    if (isPathEditing && pathInputRef.current) {
      pathInputRef.current.focus();
      pathInputRef.current.select();
    }
  }, [isPathEditing]);

  const handlePathClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPathEditStart();
  };

  return (
    <div className="flex items-center gap-3">
      {/* 导航按钮 */}
      <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/10">
        <button
          onClick={onGoBack}
          disabled={historyIndex === 0}
          className="p-1.5 text-gray-400 hover:bg-white/10 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="后退"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onGoForward}
          disabled={historyIndex >= pathHistory.length - 1}
          className="p-1.5 text-gray-400 hover:bg-white/10 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="前进"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={onGoUp}
          disabled={currentPath === '/'}
          className="p-1.5 text-gray-400 hover:bg-white/10 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="上级目录"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* 路径栏 */}
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 min-w-[300px] max-w-[500px]">
        <button
          onClick={() => onNavigate('/')}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded transition-all"
          title="根目录"
        >
          <HardDrive className="w-3.5 h-3.5" />
        </button>

        {isPathEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={pathInputRef}
              type="text"
              value={pathInputValue}
              onChange={(e) => onPathInputChange(e.target.value)}
              onKeyDown={onPathSubmit}
              onBlur={onPathEditCancel}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 font-mono"
              placeholder="输入路径..."
              autoFocus
            />
            <button
              onClick={() => {
                if (pathInputValue.trim() && pathInputValue !== currentPath) {
                  onNavigate(pathInputValue.trim());
                }
                onPathEditCancel();
              }}
              className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"
              title="确认"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center text-sm text-gray-300 overflow-hidden cursor-text flex-1"
            onClick={handlePathClick}
          >
            {currentPath === '/' ? (
              <span className="text-gray-500 font-mono">/</span>
            ) : (
              pathParts.map((part, index) => {
                const path = '/' + pathParts.slice(0, index + 1).join('/');
                return (
                  <span key={index} className="flex items-center">
                    <span className="text-gray-600 mx-0.5">/</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(path);
                      }}
                      className="hover:bg-white/10 px-1 py-0.5 rounded transition-colors whitespace-nowrap"
                      title={`跳转到 ${path}`}
                    >
                      {part}
                    </button>
                  </span>
                );
              })
            )}
          </div>
        )}

        {/* 路径操作按钮 */}
        {!isPathEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={onPathEditStart}
              className="p-1 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"
              title="编辑路径"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCopyPath}
              className="p-1 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-all"
              title="复制路径"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 快捷路径下拉菜单 */}
      <div className="relative">
        <button
          onClick={() => setShowPathDropdown(!showPathDropdown)}
          className="px-2 py-1.5 text-xs text-gray-400 hover:bg-white/10 rounded-md transition-all border border-white/10"
        >
          快捷路径
        </button>
        {showPathDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-[#2a2a2a] rounded-lg shadow-lg border border-white/10 py-1 min-w-[120px] z-50">
            {quickPaths.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setShowPathDropdown(false);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-white/5 transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PathBar;
