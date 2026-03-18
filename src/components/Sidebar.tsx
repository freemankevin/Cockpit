import { FC } from 'react';

interface SidebarProps {
  hostCount?: number;
}

const Sidebar = ({ hostCount = 0 }: SidebarProps) => {
  const menuItems = [
    { iconClass: 'fa-solid fa-server', label: 'Host Management', active: true, badge: hostCount > 0 ? String(hostCount) : undefined },
    { iconClass: 'fa-solid fa-code-branch', label: 'Version Control', active: false },
    { iconClass: 'fa-solid fa-box', label: 'Container Management', active: false },
    { iconClass: 'fa-solid fa-database', label: 'Database Deployment', active: false },
  ];

  const systemItems = [
    { iconClass: 'fa-solid fa-clock-rotate-left', label: 'Deployment History', active: false },
    { iconClass: 'fa-solid fa-gear', label: 'Settings', active: false },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-5">
        <div className="flex items-center gap-3 group cursor-pointer">
          {/* Logo */}
          <img 
            src="/favicon-32x32.png" 
            alt="DeployMaster Logo" 
            className="w-10 h-10 rounded-lg"
          />
          <h1 className="font-semibold text-[15px] text-gray-900 tracking-tight">DeployMaster</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-6 overflow-y-auto">
        {/* Deploy Section */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-2">
            <i className="fa-solid fa-layer-group w-3.5 h-3.5 text-gray-400"></i>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Deployment Features</span>
          </div>
          <div className="space-y-0.5">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium
                  transition-all duration-200 group
                  ${item.active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <i className={`${item.iconClass} w-[18px] h-[18px] text-center transition-colors duration-200
                  ${item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}></i>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-md">
                    {item.badge}
                  </span>
                )}
                {item.active && (
                  <i className="fa-solid fa-chevron-right w-3.5 h-3.5 text-blue-600"></i>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* System Section */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">System</span>
          </div>
          <div className="space-y-0.5">
            {systemItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium
                  transition-all duration-200 group
                  ${item.active 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <i className={`${item.iconClass} w-[18px] h-[18px] text-center transition-colors duration-200
                  ${item.active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}></i>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200
                      hover:bg-gray-100 transition-all duration-200 cursor-pointer group">
          {/* Avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center
                          shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <span className="text-white text-xs font-semibold">A</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">Administrator</p>
            <p className="text-[11px] text-gray-500 truncate">admin@deploymaster.io</p>
          </div>
          
          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg 
                           transition-all duration-200 opacity-0 group-hover:opacity-100">
            <i className="fa-solid fa-right-from-bracket w-4 h-4"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
