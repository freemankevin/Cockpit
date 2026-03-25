import { FC, useState } from 'react';

interface SidebarProps {
  hostCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = ({ hostCount = 0, collapsed = false, onToggleCollapse }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.();
  };

  const menuItems = [
    { iconClass: 'fa-solid fa-server', label: 'Host Management', active: true, badge: hostCount > 0 ? String(hostCount) : undefined },
    { iconClass: 'fa-solid fa-code-branch', label: 'Version Control', active: false },
    { iconClass: 'fa-solid fa-box', label: 'Container Management', active: false },
    { iconClass: 'fa-solid fa-database', label: 'Database Deployment', active: false },
  ];

  const systemItems = [
    { iconClass: 'fa-solid fa-clock-rotate-left', label: 'Deployment History', active: false },
    { iconClass: 'fa-solid fa-gear', label: 'System Settings', active: false },
  ];

  // 收起后保留 48px 图标窄栏
  const collapsedClass = isCollapsed ? 'w-12 min-w-[48px]' : 'w-56 xl:w-64';

  return (
    <aside 
      className={`${collapsedClass} h-full bg-background-secondary/80 backdrop-blur-sm border-r border-border-primary flex flex-col relative
                  transition-[width] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-visible shrink-0`}
    >
      {/* Logo Section */}
      <div className={`p-3 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <img 
          src="/favicon-32x32.png" 
          alt="DeployMaster Logo" 
          className="w-7 h-7 rounded-lg shadow-macos-button shrink-0 object-contain"
        />
        {!isCollapsed && (
          <h1 className="font-semibold text-[14px] text-text-primary tracking-tight whitespace-nowrap ml-2">DeployMaster</h1>
        )}
      </div>

      {/* Collapse Toggle Button - Below logo, above navigation */}
      <div className={`px-2 pb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleToggle}
          className={`flex items-center justify-center gap-1.5 rounded-lg transition-all duration-200
                     ${isCollapsed 
                       ? 'w-8 h-8 bg-background-tertiary/80 border border-border-primary hover:bg-background-hover' 
                       : 'w-full py-1.5 bg-background-tertiary/50 border border-border-primary hover:bg-background-hover'
                     }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-xs text-text-secondary`}></i>
          {!isCollapsed && <span className="text-xs text-text-secondary">Collapse</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {/* Deploy Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-layer-group w-3 h-3 text-text-tertiary"></i>
              <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Deployment</span>
            </div>
          )}
          <div className="space-y-0.5">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href="#"
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                  transition-all duration-200 group/item
                  ${isCollapsed ? 'justify-center' : ''}
                  ${item.active 
                    ? 'bg-macos-blue/15 text-macos-blue border border-macos-blue/25' 
                    : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                  }`}
              >
                <i className={`${item.iconClass} w-[18px] h-[18px] text-center shrink-0 transition-colors duration-200
                  ${item.active ? 'text-macos-blue' : 'text-text-tertiary group-hover/item:text-text-secondary'}`}></i>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-macos-blue/25 text-macos-blue text-[10px] font-semibold rounded-md shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {item.active && !isCollapsed && (
                  <i className="fa-solid fa-chevron-right w-3 h-3 text-macos-blue/60 shrink-0"></i>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* System Section */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">System</span>
            </div>
          )}
          <div className="space-y-0.5">
            {systemItems.map((item) => (
              <a
                key={item.label}
                href="#"
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                  transition-all duration-200 group/item
                  ${isCollapsed ? 'justify-center' : ''}
                  ${item.active 
                    ? 'bg-macos-blue/15 text-macos-blue border border-macos-blue/25' 
                    : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                  }`}
              >
                <i className={`${item.iconClass} w-[18px] h-[18px] text-center shrink-0 transition-colors duration-200
                  ${item.active ? 'text-macos-blue' : 'text-text-tertiary group-hover/item:text-text-secondary'}`}></i>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile - Show icon only when collapsed */}
      <div className={`p-2 border-t border-border-primary shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <button
            className="w-8 h-8 rounded-full bg-macos-blue/20 flex items-center justify-center
                      hover:bg-macos-blue/30 transition-colors duration-200"
            title="Admin"
          >
            <i className="fa-solid fa-user text-sm text-macos-blue"></i>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-background-tertiary/80 border border-border-primary
                        hover:bg-background-hover transition-all duration-200 cursor-pointer group">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-macos-blue to-macos-purple flex items-center justify-center
                            shadow-macos-button group-hover:shadow-glow-blue transition-shadow duration-200">
                <span className="text-white text-xs font-semibold">A</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-macos-green rounded-full border-2 border-background-tertiary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate">Admin</p>
              <p className="text-[11px] text-text-tertiary truncate">admin@deploymaster.io</p>
            </div>
            
            <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-background-elevated rounded-lg 
                             transition-all duration-200 opacity-0 group-hover:opacity-100">
              <i className="fa-solid fa-right-from-bracket w-4 h-4"></i>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;