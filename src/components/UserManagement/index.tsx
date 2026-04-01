import React from 'react';
import type { User } from '../../types';
import { styles, getRoleBadgeStyle, roleLabels } from './styles';
import { useUserManagement } from './useUserManagement';
import { UserFormModal, DeleteConfirmModal, ResetPasswordModal } from './Modals';
import {
  Users,
  Plus,
  Loader2,
  Inbox,
  ShieldCheck,
  Wrench,
  Eye,
  Pencil,
  Key,
  Trash2,
} from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const {
    users,
    loading,
    formData,
    selectedUser,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showResetPasswordModal,
    formLoading,
    newPassword,
    confirmPassword,
    setShowCreateModal,
    setShowEditModal,
    setShowDeleteConfirm,
    setShowResetPasswordModal,
    setFormData,
    setSelectedUser,
    setNewPassword,
    setConfirmPassword,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleResetPassword,
    handleUserAvatarUpdate,
    openEditModal,
    resetForm,
  } = useUserManagement();

  // Button hover handlers - Railway style interactions
  const handleCreateButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--accent-hover)';
  };
  
  const handleCreateButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--accent)';
  };

  const handleActionButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--bg-elevated)';
    e.currentTarget.style.color = 'var(--text-primary)';
  };
  
  const handleActionButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = 'var(--text-tertiary)';
  };

  const handleDeleteButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--color-error-muted)';
  };
  
  const handleDeleteButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent';
  };

  const handleTableRowHover = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.background = 'var(--bg-overlay)';
  };
  
  const handleTableRowLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.background = 'transparent';
  };

  // Get avatar URL - same logic as Header component
  const getAvatarUrl = (user: User) => {
    if (user.avatar) {
      // If avatar is a full URL, use it directly
      if (user.avatar.startsWith('http')) return user.avatar;
      // Otherwise, prepend the API base
      return `http://127.0.0.1:8000${user.avatar}`;
    }
    // Default avatar
    return '/cat.jpg';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <Users className="w-5 h-5" style={styles.titleIcon} />
            User Management
          </h2>
          <p style={styles.subtitle}>Manage system users and permissions</p>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            style={styles.createButton}
            onMouseEnter={handleCreateButtonHover}
            onMouseLeave={handleCreateButtonLeave}
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Users table */}
      <div style={styles.tableContainer}>
        {loading ? (
          // Railway style loading - spinner only, no text logs
          <div style={styles.loading}>
            <Loader2 className="w-5 h-5 animate-spin" style={styles.loadingIcon} />
          </div>
        ) : users.length === 0 ? (
          // Empty state - Railway style
          <div style={styles.empty}>
            <Inbox className="w-10 h-10" style={styles.emptyIcon} />
            <p style={styles.emptyText}>No users found</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Last Login</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  style={styles.tr}
                  onMouseEnter={handleTableRowHover}
                  onMouseLeave={handleTableRowLeave}
                >
                  <td style={styles.td}>
                    <div style={styles.userName}>
                      <div style={styles.avatar}>
                        {getAvatarUrl(user) ? (
                          <img
                            src={getAvatarUrl(user)}
                            alt={user.username}
                            className="w-full h-full object-cover"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-default)',
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                      {user.id === currentUser.id && (
                        <span style={styles.currentUserBadge}>Current</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={getRoleBadgeStyle(user.role)}>
                      {user.role === 'admin' ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : user.role === 'operator' ? (
                        <Wrench className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td style={styles.td}>{user.email || '-'}</td>
                  <td style={styles.td}>{user.phone || '-'}</td>
                  <td style={styles.td}>
                    <span style={user.is_active ? styles.statusActive : styles.statusInactive}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button 
                        onClick={() => openEditModal(user)} 
                        style={styles.actionButton} 
                        title="Edit"
                        onMouseEnter={handleActionButtonHover}
                        onMouseLeave={handleActionButtonLeave}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(user); setShowResetPasswordModal(true); }}
                        style={styles.actionButton}
                        title="Reset Password"
                        onMouseEnter={handleActionButtonHover}
                        onMouseLeave={handleActionButtonLeave}
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {/* Cannot delete self or default admin user */}
                      {user.id !== currentUser.id && user.username !== 'admin' && (
                        <button
                          onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }}
                          style={styles.deleteButton}
                          title="Delete"
                          onMouseEnter={handleDeleteButtonHover}
                          onMouseLeave={handleDeleteButtonLeave}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        mode="create"
        visible={showCreateModal}
        user={null}
        formData={formData}
        loading={formLoading}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        onSubmit={handleCreateUser}
        onFormChange={setFormData}
        onUserUpdate={handleUserAvatarUpdate}
      />

      <UserFormModal
        mode="edit"
        visible={showEditModal}
        user={selectedUser}
        formData={formData}
        loading={formLoading}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        onSubmit={handleUpdateUser}
        onFormChange={setFormData}
        onUserUpdate={handleUserAvatarUpdate}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        user={selectedUser}
        loading={formLoading}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
      />

      <ResetPasswordModal
        visible={showResetPasswordModal}
        user={selectedUser}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        loading={formLoading}
        onClose={() => { setShowResetPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }}
        onConfirm={handleResetPassword}
        onPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
      />
    </div>
  );
};

export default UserManagement;