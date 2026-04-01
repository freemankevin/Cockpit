// User management styles - Railway Design System
import type { UserRole } from '../../types';

export const styles: Record<string, React.CSSProperties> = {
  // Container - Railway 风格
  container: {
    padding: 'var(--space-6)',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  
  // Header section
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-6)',
  },
  
  // Title - Railway 文字层级
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  
  titleIcon: {
    color: 'var(--accent)',
  },
  
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 'var(--space-1) 0 0',
  },
  
  headerActions: {
    display: 'flex',
    gap: 'var(--space-3)',
  },
  
  // Create button - Railway 主按钮（纯色，无渐变）
  createButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'white',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-default)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  
  // Table container - Railway 卡片风格
  tableContainer: {
    backgroundColor: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '0.5px solid var(--border-default)',
    overflow: 'hidden',
    // Railway 规范：禁止使用 box-shadow
  },
  
  // Loading state - Railway 风格（仅显示 spinner，无文字）
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
  },
  
  loadingIcon: {
    color: 'var(--accent)',
    animation: 'spin 1s linear infinite',
  },
  
  // Empty state - Railway 风格
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    color: 'var(--text-tertiary)',
  },
  
  emptyIcon: {
    color: 'var(--text-tertiary)',
    marginBottom: 'var(--space-3)',
  },
  
  emptyText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  
  // Table - Railway 数据表格
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  
  // Table header - Railway 风格
  th: {
    padding: 'var(--space-3) var(--space-4)',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    backgroundColor: 'var(--bg-surface)',
    borderBottom: '0.5px solid var(--border-subtle)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  
  // Table row
  tr: {
    borderBottom: '0.5px solid var(--border-subtle)',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  
  // Table cell
  td: {
    padding: 'var(--space-3) var(--space-4)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    verticalAlign: 'middle',
  },
  
  // User name cell with avatar
  userName: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  
  // Avatar - Railway 风格
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-default)',
    background: 'var(--accent-muted)',
    border: '0.5px solid var(--accent)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
  },
  
  // Current user badge - Railway 风格
  currentUserBadge: {
    padding: '2px var(--space-2)',
    fontSize: '10px',
    fontWeight: 500,
    color: 'var(--accent)',
    backgroundColor: 'var(--accent-muted)',
    borderRadius: 'var(--radius-sm)',
  },
  
  // Status styles - Railway 语义色
  statusActive: {
    color: 'var(--color-success-text)',
    fontWeight: 500,
  },
  
  statusInactive: {
    color: 'var(--color-error-text)',
    fontWeight: 500,
  },
  
  // Actions container
  actions: {
    display: 'flex',
    gap: 'var(--space-1)',
  },
  
  // Action button - Railway 幽灵按钮
  actionButton: {
    padding: 'var(--space-1) var(--space-2)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-default)',
    fontSize: '14px',
    transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
  },
  
  // Delete button - Railway 危险按钮
  deleteButton: {
    padding: 'var(--space-1) var(--space-2)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-error-text)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-default)',
    fontSize: '14px',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  
  // Modal overlay - Railway Modal 背景
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 13, 15, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  
  // Modal - Railway 风格
  modal: {
    backgroundColor: 'var(--bg-overlay)',
    borderRadius: 'var(--radius-lg)',
    border: '0.5px solid var(--border-default)',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'hidden',
    // Railway 规范：Modal 可使用轻微阴影
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
  },
  
  // Modal header - Railway 风格
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-5) var(--space-6)',
    borderBottom: '0.5px solid var(--border-subtle)',
    background: 'var(--bg-elevated)',
  },
  
  modalTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  
  // Close button - Railway 风格
  closeButton: {
    padding: 'var(--space-1)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-default)',
    fontSize: '16px',
    transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)',
  },
  
  // Modal body
  modalBody: {
    padding: 'var(--space-6)',
  },
  
  // Modal footer - Railway 风格
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-6)',
    borderTop: '0.5px solid var(--border-subtle)',
    background: 'var(--bg-elevated)',
  },
  
  // Form group
  formGroup: {
    marginBottom: 'var(--space-4)',
  },
  
  // Label - Railway 文字层级
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-2)',
  },
  
  // Input - Railway 输入框风格
  input: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    border: '0.5px solid var(--border-default)',
    borderRadius: 'var(--radius-default)',
    backgroundColor: 'var(--bg-overlay)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--duration-fast) var(--ease-out)',
  },
  
  // Password wrapper
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  
  passwordInput: {
    paddingRight: '40px',
  },
  
  // Cancel button - Railway 次要按钮
  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    border: '0.5px solid var(--border-default)',
    borderRadius: 'var(--radius-default)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
  },
  
  // Confirm button - Railway 主按钮
  confirmButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'white',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-default)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  
  // Delete confirm button - Railway 危险主按钮
  deleteConfirmButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: '13px',
    fontWeight: 500,
    color: 'white',
    backgroundColor: 'var(--color-error)',
    border: 'none',
    borderRadius: 'var(--radius-default)',
    cursor: 'pointer',
    transition: 'background var(--duration-fast) var(--ease-out)',
  },
  
  // Confirm text
  confirmText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: '0 0 var(--space-4)',
    lineHeight: 1.5,
  },
  
  // Select - Railway 输入框风格
  select: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    border: '0.5px solid var(--border-default)',
    borderRadius: 'var(--radius-default)',
    backgroundColor: 'var(--bg-overlay)',
    cursor: 'pointer',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color var(--duration-fast) var(--ease-out)',
  },
};

// Role badge style helper - Railway 风格
export const getRoleBadgeStyle = (role: UserRole): React.CSSProperties => {
  const colors: Record<UserRole, { bg: string; color: string }> = {
    admin: { bg: 'var(--accent-muted)', color: 'var(--accent)' },
    operator: { bg: 'var(--color-info-muted)', color: 'var(--color-info-text)' },
    viewer: { bg: 'var(--color-neutral-muted)', color: 'var(--color-neutral-text)' },
  };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    padding: '3px var(--space-3)',
    borderRadius: '100px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: colors[role].bg,
    color: colors[role].color,
  };
};

// Role labels
export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  viewer: 'Viewer',
};