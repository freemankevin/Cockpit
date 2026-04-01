import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { User, UserRole, AuditLog, CreateUserRequest } from '../../types';
import { styles } from './styles';
import { authApi } from '../../services/authApi';
import { useToast } from '../../hooks/useToast';
import {
  X,
  Plus,
  Check,
  Loader2,
  Trash2,
  Key,
  BookText,
  Eye,
  EyeOff,
  Camera,
  UserCircle,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

// Password input with toggle visibility
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ value, onChange, placeholder, label }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label}</label>
      <div style={styles.passwordWrapper}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...styles.input, ...styles.passwordInput }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle-btn"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

// Custom Select Component - Railway Design
interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && hoveredIndex >= 0) {
            onChange(options[hoveredIndex].value);
            setIsOpen(false);
            setHoveredIndex(-1);
          } else {
            setIsOpen(!isOpen);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHoveredIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHoveredIndex(0);
          } else {
            setHoveredIndex((prev) => (prev + 1) % options.length);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHoveredIndex(options.length - 1);
          } else {
            setHoveredIndex((prev) => (prev - 1 + options.length) % options.length);
          }
          break;
      }
    },
    [disabled, isOpen, hoveredIndex, options, onChange]
  );

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHoveredIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      style={styles.customSelect}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <div
        style={{
          ...styles.customSelectTrigger,
          ...(isOpen ? styles.customSelectTriggerOpen : {}),
          ...(disabled ? styles.customSelectTriggerDisabled : {}),
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={styles.customSelectValue}>
          {selectedOption ? (
            <>
              {selectedOption.icon}
              {selectedOption.label}
            </>
          ) : (
            <span style={{ color: 'var(--text-tertiary)' }}>{placeholder}</span>
          )}
        </span>
        <span
          style={{
            ...styles.customSelectArrow,
            ...(isOpen ? styles.customSelectArrowOpen : {}),
          }}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>

      {isOpen && (
        <div style={styles.customSelectDropdown}>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHovered = index === hoveredIndex;

            let optionStyle = { ...styles.customSelectOption };
            if (isSelected) {
              optionStyle = { ...optionStyle, ...styles.customSelectOptionSelected };
            } else if (isHovered) {
              optionStyle = { ...optionStyle, ...styles.customSelectOptionHover };
            }

            return (
              <div
                key={option.value}
                style={optionStyle}
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(-1)}
              >
                {option.icon}
                <span>{option.label}</span>
                {isSelected && (
                  <span style={styles.customSelectCheck}>
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper function to get avatar URL
const getAvatarUrl = (user: User | null): string => {
  if (user?.avatar) {
    if (user.avatar.startsWith('http')) return user.avatar;
    return `http://127.0.0.1:8000${user.avatar}`;
  }
  return '/cat.jpg';
};

// User Form Modal
interface UserFormModalProps {
  mode: 'create' | 'edit';
  visible: boolean;
  user: User | null;
  formData: CreateUserRequest;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (data: CreateUserRequest) => void;
  onUserUpdate?: (user: User) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  mode,
  visible,
  user,
  formData,
  loading,
  onClose,
  onSubmit,
  onFormChange,
  onUserUpdate,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  if (!visible) return null;

  // Check if user is default admin (username === 'admin')
  const isDefaultAdmin = mode === 'edit' && user?.username === 'admin';
  
  // Get avatar URL with preview support
  const getDisplayAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatar) {
      if (user.avatar.startsWith('http')) return user.avatar;
      return `http://127.0.0.1:8000${user.avatar}`;
    }
    return '/cat.jpg';
  };

  // Handle avatar file selection - auto upload on select
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Reset input to allow re-selecting same file
    e.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('错误', '请选择有效的图片文件');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('错误', '图片大小不能超过 10MB');
      return;
    }

    // Create preview and upload immediately
    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const avatarData = event.target?.result as string;
      setAvatarPreview(avatarData);
      
      try {
        // Use usersApi to upload avatar for the specific user
        const result = await authApi.uploadAvatarForUser(user.id, avatarData);
        if (result.code === 0 && result.data?.user) {
          if (onUserUpdate) {
            onUserUpdate(result.data.user);
          }
          toast.success('成功', '头像更新成功');
          setAvatarPreview(null);
        } else {
          toast.error('错误', result.message || '头像上传失败');
          setAvatarPreview(null);
        }
      } catch {
        toast.error('错误', '头像上传失败');
        setAvatarPreview(null);
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '520px' }}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={styles.modalBody}>
          {mode === 'edit' && user && (
            // Avatar section with upload capability (circular)
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-5)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '0.5px solid var(--border-subtle)',
            }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  border: avatarLoading ? '2px solid var(--accent)' : '1.5px solid var(--border-default)',
                  flexShrink: 0,
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => !avatarLoading && fileInputRef.current?.click()}
              >
                <img
                  src={getDisplayAvatarUrl()}
                  alt={user.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Hover overlay for upload */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.6)',
                    opacity: avatarLoading ? 1 : 0,
                    transition: 'opacity 150ms ease-out',
                    borderRadius: '50%',
                  }}
                  onMouseEnter={(e) => {
                    if (!avatarLoading) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!avatarLoading) {
                      e.currentTarget.style.opacity = '0';
                    }
                  }}
                >
                  {avatarLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-white" />
                      <span style={{ color: 'white', fontSize: '11px', marginTop: '4px' }}>Upload</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {user.username}
                  {isDefaultAdmin && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      background: 'var(--accent-muted)',
                      color: 'var(--accent)',
                      borderRadius: '4px',
                      fontWeight: 500,
                    }}>
                      Default Admin
                    </span>
                  )}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}>
                  User ID: {user.id}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                }}>
                  Click avatar to upload new image
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
          {mode === 'create' && (
            <>
              <div style={styles.formGroup}>
                <label style={{
                  ...styles.label,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <UserCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => onFormChange({ ...formData, username: e.target.value })}
                  placeholder="Enter username (at least 3 characters)"
                  style={styles.input}
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <PasswordInput
                value={formData.password}
                onChange={(password) => onFormChange({ ...formData, password })}
                placeholder="Enter password (at least 6 characters)"
                label="Password *"
              />
            </>
          )}
          {/* Role field - disabled for default admin */}
          <div style={styles.formGroup}>
            <label style={{
              ...styles.label,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Role
              {isDefaultAdmin && (
                <Lock className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              )}
            </label>
            <CustomSelect
              value={formData.role}
              options={[
                { value: 'viewer', label: 'Viewer' },
                { value: 'operator', label: 'Operator' },
                { value: 'admin', label: 'Administrator' },
              ]}
              onChange={(value) => onFormChange({ ...formData, role: value as UserRole })}
              disabled={isDefaultAdmin}
            />
            {isDefaultAdmin && (
              <p style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <AlertCircle className="w-3 h-3" />
                Default admin role cannot be changed
              </p>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={{
              ...styles.label,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Mail className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              placeholder="Enter email address (optional)"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={{
              ...styles.label,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Phone className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number (optional)"
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelButton}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button onClick={onSubmit} disabled={loading || avatarLoading} style={styles.confirmButton}>
            {loading || avatarLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {mode === 'create' ? (
                  <Plus className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{mode === 'create' ? 'Create' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirm Modal
interface DeleteConfirmModalProps {
  visible: boolean;
  user: User | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  user,
  loading,
  onClose,
  onConfirm,
}) => {
  if (!visible || !user) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '400px' }}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Confirm Delete</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.confirmText}>
            Are you sure you want to delete user <strong>{user.username}</strong>? This action cannot be undone.
          </p>
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelButton}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button onClick={onConfirm} disabled={loading} style={styles.deleteConfirmButton}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reset Password Modal
interface ResetPasswordModalProps {
  visible: boolean;
  user: User | null;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  user,
  newPassword,
  confirmPassword,
  loading,
  onClose,
  onConfirm,
  onPasswordChange,
  onConfirmPasswordChange,
}) => {
  const isPasswordValid = newPassword.length >= 6;
  const isPasswordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isFormValid = isPasswordValid && isPasswordsMatch;

  if (!visible || !user) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '440px' }}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>
            <Key className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>Reset Password</span>
          </h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={styles.modalBody}>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-5)',
            lineHeight: 1.5,
          }}>
            Set a new password for user <strong style={{ color: 'var(--text-primary)' }}>{user.username}</strong>
          </p>
          <PasswordInput
            value={newPassword}
            onChange={onPasswordChange}
            placeholder="Enter new password (at least 6 characters)"
            label="New Password"
          />
          <PasswordInput
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            placeholder="Confirm new password"
            label="Confirm New Password"
          />
          {confirmPassword && !isPasswordsMatch && (
            <p style={{
              fontSize: '12px',
              color: 'var(--color-error)',
              marginTop: '-8px',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <X className="w-3 h-3" />
              Passwords do not match
            </p>
          )}
          {newPassword && !isPasswordValid && (
            <p style={{
              fontSize: '12px',
              color: 'var(--color-error)',
              marginTop: '-8px',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <X className="w-3 h-3" />
              Password must be at least 6 characters
            </p>
          )}
          {isPasswordValid && isPasswordsMatch && (
            <p style={{
              fontSize: '12px',
              color: 'var(--color-success)',
              marginTop: '-8px',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Check className="w-3 h-3" />
              Password is valid
            </p>
          )}
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelButton}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !isFormValid}
            style={{
              ...styles.confirmButton,
              opacity: !isFormValid ? 0.5 : 1,
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Audit Logs Modal
interface AuditLogsModalProps {
  visible: boolean;
  logs: AuditLog[];
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({
  visible,
  logs,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: '900px', maxHeight: '80vh' }}>
        <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              <BookText className="w-4 h-4" />
              <span>Audit Logs</span>
            </h3>
            <button onClick={onClose} style={styles.closeButton}>
              <X className="w-4 h-4" />
            </button>
          </div>
        <div style={{ ...styles.modalBody, padding: 0, maxHeight: '60vh', overflow: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Resource</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>IP</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={styles.tr}>
                  <td style={styles.td}>{new Date(log.created_at).toLocaleString('en-US')}</td>
                  <td style={styles.td}>{log.username}</td>
                  <td style={styles.td}>{log.action}</td>
                  <td style={styles.td}>{log.resource}</td>
                  <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.detail}
                  </td>
                  <td style={styles.td}>{log.source_ip}</td>
                  <td style={styles.td}>
                    <span style={log.status === 'success' ? styles.statusActive : styles.statusInactive}>
                      {log.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};