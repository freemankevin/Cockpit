import { useState } from 'react';
import type { User } from '../types';

// Page types - all available pages
export type PageType =
  | 'hosts'
  | 'appstore'
  | 'containers'
  | 'container-install'
  | 'container-images'
  | 'container-services'
  | 'container-compose'
  | 'container-repo'
  | 'monitor'
  | 'logs'
  | 'alerts'
  | 'certificates'
  | 'firewall'
  | 'cronjob'
  | 'settings'
  | 'settings-users'
  | 'settings-audit'
  | 'settings-about';

// Navigation item interface
interface NavItem {
  id: PageType;
  label: string;
  icon?: string; // Font Awesome icon class
  adminOnly?: boolean;
  isSubItem?: boolean;
}

// Navigation group interface (items with divider)
interface NavGroup {
  items: NavItem[];
  subItems?: NavItem[]; // Sub-items for expandable menu
  expandKey?: PageType; // Key to identify which parent is expandable
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentPage?: PageType;
  onPageChange?: (page: PageType) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

// Navigation structure - groups separated by dividers
const navigationGroups: NavGroup[] = [
  {
    items: [
      { id: 'hosts', label: 'Hosts', icon: 'fa-solid fa-server' },
      { id: 'appstore', label: 'Appstore', icon: 'fa-solid fa-store' },
    ],
  },
  {
    items: [
      { id: 'containers', label: 'Containers', icon: 'fa-solid fa-cube' },
    ],
    subItems: [
      { id: 'container-install', label: 'Install', isSubItem: true },
      { id: 'container-images', label: 'Images', isSubItem: true },
      { id: 'container-services', label: 'Services', isSubItem: true },
      { id: 'container-compose', label: 'Compose', isSubItem: true },
      { id: 'container-repo', label: 'Repo', isSubItem: true },
    ],
    expandKey: 'containers',
  },
  {
    items: [
      { id: 'monitor', label: 'Monitor', icon: 'fa-solid fa-gauge-high' },
      { id: 'logs', label: 'Logs', icon: 'fa-solid fa-file-lines' },
      { id: 'alerts', label: 'Alerts', icon: 'fa-solid fa-bell' },
    ],
  },
  {
    items: [
      { id: 'certificates', label: 'Certificates', icon: 'fa-solid fa-certificate' },
      { id: 'firewall', label: 'Firewall', icon: 'fa-solid fa-shield-halved' },
    ],
  },
  {
    items: [
      { id: 'cronjob', label: 'Cronjob', icon: 'fa-solid fa-clock' },
    ],
  },
  {
    items: [
      { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
    ],
    subItems: [
      { id: 'settings-users', label: 'Users', isSubItem: true, adminOnly: true },
      { id: 'settings-audit', label: 'Audit', isSubItem: true, adminOnly: true },
      { id: 'settings-about', label: 'About', isSubItem: true },
    ],
    expandKey: 'settings',
  },
];

const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  currentPage = 'hosts',
  onPageChange,
  currentUser,
  onLogout,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<PageType>>(new Set());

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggleCollapse?.();
  };

  const toggleExpand = (key: PageType) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Check if current page is a sub-item of a parent
  const isParentActive = (parentId: PageType, subItems?: NavItem[]): boolean => {
    if (currentPage === parentId) return true;
    if (subItems) {
      return subItems.some(item => item.id === currentPage);
    }
    return false;
  };

  // Filter groups based on user role
  const filteredGroups = navigationGroups.map(group => {
    const filteredSubItems = group.subItems?.filter(item => {
      if (item.adminOnly && currentUser?.role !== 'admin') {
        return false;
      }
      return true;
    });
    return {
      ...group,
      subItems: filteredSubItems,
    };
  }).filter(group => group.items.length > 0);

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
          <h1 className="font-semibold text-[16px] text-text-primary tracking-tight whitespace-nowrap ml-2 font-heading">Cockpit</h1>
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

      {/* Divider */}
      <div className="mx-3 mt-1 mb-3 border-t border-border-primary" />

      {/* Main Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto overflow-x-hidden">
        {filteredGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Group Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = currentPage === item.id;
                const hasSubItems = group.subItems && group.subItems.length > 0;
                const isExpanded = expandedMenus.has(item.id);
                const parentActive = isParentActive(item.id, group.subItems);

                return (
                  <div key={item.id}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasSubItems) {
                          toggleExpand(item.id);
                        } else {
                          onPageChange?.(item.id);
                        }
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium
                        transition-all duration-150
                        ${isCollapsed ? 'justify-center' : ''}
                        ${parentActive
                          ? 'bg-primary/10 text-text-primary'
                          : 'text-[#a1a1aa] hover:bg-background-tertiary hover:text-[#d4d4d8]'
                        }`}
                    >
                      {item.icon && (
                        <i className={`${item.icon} w-[18px] h-[18px] text-center shrink-0
                          ${parentActive ? 'text-primary' : 'text-[#71717a]'}`}></i>
                      )}
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {hasSubItems && (
                            <i className={`fa-solid fa-chevron-down text-[10px] text-[#71717a]/40 transition-transform duration-200 shrink-0 ml-1
                              ${isExpanded ? 'rotate-180' : ''}`}></i>
                          )}
                        </>
                      )}
                    </a>

                    {/* Sub Items - Railway Style */}
                    {hasSubItems && !isCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-200 ease-out
                          ${isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}
                      >
                        <div className="relative ml-4 pl-3 py-1">
                          {/* Left border line - Railway style, more subtle than text */}
                          <div className="absolute left-0 top-2 bottom-2 w-px bg-[#94a09e]/30" />
                          
                          <div className="space-y-0.5">
                            {group.subItems!.map((subItem) => {
                              const subIsActive = currentPage === subItem.id;
                              return (
                                <a
                                  key={subItem.id}
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange?.(subItem.id);
                                  }}
                                  className={`flex items-center px-3 py-1.5 rounded-md text-[14px] font-medium
                                    transition-all duration-150 ease-out
                                    ${subIsActive
                                      ? 'bg-primary/10 text-text-primary'
                                      : 'text-[#94a09e] hover:bg-background-tertiary/60 hover:text-[#b0b8b5]'
                                    }`}
                                >
                                  <span className="truncate">{subItem.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Group Divider - with spacing */}
            {groupIndex < filteredGroups.length - 1 && (
              <div className="mx-3 my-3 border-t border-border-primary" />
            )}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-3 border-t border-border-primary" />

      {/* User Profile */}
      <div className={`p-2 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <button
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center
                      hover:opacity-80 transition-opacity duration-200"
            title={currentUser?.username || 'User'}
          >
            <span className="text-white text-xs font-semibold">{getUserInitials()}</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-background-tertiary/50
                        hover:bg-background-tertiary transition-all duration-200 cursor-pointer group">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{getUserInitials()}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-status-success rounded-full border-2 border-background-tertiary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text-primary truncate">{currentUser?.username || 'User'}</p>
              <p className="text-[11px] text-text-tertiary truncate">{getRoleLabel()}</p>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-text-tertiary hover:text-status-error hover:bg-status-error/10 rounded-lg
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