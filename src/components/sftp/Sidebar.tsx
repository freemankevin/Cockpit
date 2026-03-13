import { HardDrive, Folder, Settings, FileText } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  hostAddress: string;
  fileCount: number;
  onNavigate: (path: string) => void;
}

const Sidebar = ({ currentPath, hostAddress, fileCount, onNavigate }: SidebarProps) => {
  const locations = [
    { path: '/', icon: HardDrive, label: '根目录', color: 'text-gray-500' },
    { path: '/home', icon: Folder, label: 'Home', color: 'text-amber-500' },
    { path: '/etc', icon: Settings, label: '配置', color: 'text-gray-500' },
    { path: '/var/log', icon: FileText, label: '日志', color: 'text-gray-500' },
    { path: '/tmp', icon: Folder, label: '临时文件', color: 'text-gray-400' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <div className="w-52 bg-[#1e1e1e] border-r border-white/5 flex flex-col">
      <div className="p-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          位置
        </h4>
        <div className="space-y-0.5">
          {locations.map((location) => {
            const Icon = location.icon;
            const active = isActive(location.path);
            return (
              <button
                key={location.path}
                onClick={() => onNavigate(location.path)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-all ${
                  active
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${location.color}`} />
                {location.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-white/5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          信息
        </h4>
        <div className="px-2 space-y-2">
          <div className="text-xs text-gray-400">
            <span className="text-gray-500">地址:</span> {hostAddress}
          </div>
          <div className="text-xs text-gray-400">
            <span className="text-gray-500">当前:</span> {fileCount} 个项目
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
