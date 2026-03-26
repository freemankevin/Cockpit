import { useState } from 'react';
import type { User } from '../types';

type PageType = 'hosts' | 'users';

interface SidebarProps {
  hostCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentPage?: PageType;
  onPageChange?: (page: PageType) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

const Sidebar = ({ 
  hostCount = 0, 
  collapsed = false, 
  onToggleCollapse,
  currentPage = 'hosts',
  onPageChange,
  currentUser,
  onLogout,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.();
  };

  // Main navigation items
  const mainItems = [
    { id: 'hosts' as PageType, label: 'Hosts', icon: 'fa-solid fa-server', badge: hostCount > 0 ? String(hostCount) : undefined },
    { id: 'users' as PageType, label: 'Users', icon: 'fa-solid fa-users', adminOnly: true },
  ];

  // Filter items based on user role
  const visibleItems = mainItems.filter(item => {
    if (item.adminOnly && currentUser?.role !== 'admin') {
      return false;
    }
    return true;
  });

  // Get user initials
  const getUserInitials = () => {
    if (!currentUser?.username) return '?';
    return currentUser.username.charAt(0).toUpperCase();
  };

  // Get role label
  const getRoleLabel = () => {
    switch (currentUser?.role) {
      case 'admin': return 'Administrator';
      case 'operator': return 'Operator';
      case 'viewer': return 'Viewer';
      default: return '';
    }
  };

  const collapsedClass = isCollapsed ? 'w-12 min-w-[48px]' : 'w-52';

  return (
    <aside
      className={`${collapsedClass} h-full bg-background-secondary/80 backdrop-blur-sm border-r border-border-primary flex flex-col relative
                  transition-[width] duration-200 ease-out overflow-visible shrink-0`}
    >
      {/* Logo Section */}
      <div className={`p-3 flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
        <img
          src="/favicon-32x32.png"
          alt="Cockpit"
          className="w-7 h-7 rounded-lg shadow-macos-button shrink-0 object-contain"
        />
        {!isCollapsed && (
          <h1 className="font-semibold text-[14px] text-text-primary tracking-tight whitespace-nowrap ml-2">Cockpit</h1>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className={`px-2 pb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleToggle}
          className={`flex items-center justify-center gap-1.5 rounded-lg transition-all duration-200
                     ${isCollapsed
                       ? 'w-8 h-8 hover:bg-background-hover'
                       : 'w-full py-1.5 hover:bg-background-hover'
                     }`}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-xs text-text-tertiary`}></i>
          {!isCollapsed && <span className="text-xs text-text-tertiary">Collapse</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPageChange?.(item.id);
            }}
            title={isCollapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
              transition-all duration-150
              ${isCollapsed ? 'justify-center' : ''}
              ${currentPage === item.id
                ? 'bg-macos-blue/15 text-macos-blue'
                : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
              }`}
          >
            <i className={`${item.icon} w-[18px] h-[18px] text-center shrink-0
              ${currentPage === item.id ? 'text-macos-blue' : 'text-text-tertiary'}`}></i>
            {!isCollapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-macos-blue/20 text-macos-blue text-[10px] font-semibold rounded-md shrink-0">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </a>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`p-2 border-t border-border-primary shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <button
            className="w-8 h-8 rounded-full bg-gradient-to-br from-macos-blue to-macos-purple flex items-center justify-center
                      hover:opacity-80 transition-opacity duration-200"
            title={currentUser?.username || 'User'}
          >
            <span className="text-white text-xs font-semibold">{getUserInitials()}</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-background-tertiary/50
                        hover:bg-background-tertiary transition-all duration-200 cursor-pointer group">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-macos-blue to-macos-purple flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{getUserInitials()}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-macos-green rounded-full border-2 border-background-tertiary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-primary truncate">{currentUser?.username || 'User'}</p>
              <p className="text-[11px] text-text-tertiary truncate">{getRoleLabel()}</p>
            </div>

            <button 
              onClick={onLogout}
              className="p-1.5 text-text-tertiary hover:text-macos-red hover:bg-macos-red/10 rounded-lg
                       transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Sign Out"
            >
              <i className="fa-solid fa-right-from-bracket w-4 h-4"></i>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;