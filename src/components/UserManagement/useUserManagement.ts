import { useState, useCallback, useEffect } from 'react';
import { usersApi } from '../../services/authApi';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest, AuditLog } from '../../types';
import { useToast } from '../../hooks/useToast';

interface UseUserManagementReturn {
  users: User[];
  loading: boolean;
  total: number;
  page: number;
  auditLogs: AuditLog[];
  auditTotal: number;
  auditPage: number;
  showAuditLogs: boolean;
  formData: CreateUserRequest;
  selectedUser: User | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteConfirm: boolean;
  showResetPasswordModal: boolean;
  formLoading: boolean;
  newPassword: string;
  fetchUsers: () => Promise<void>;
  setPage: (page: number) => void;
  setAuditPage: (page: number) => void;
  setShowAuditLogs: (show: boolean) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setShowResetPasswordModal: (show: boolean) => void;
  setFormData: (data: CreateUserRequest) => void;
  setSelectedUser: (user: User | null) => void;
  setNewPassword: (password: string) => void;
  handleCreateUser: () => Promise<void>;
  handleUpdateUser: () => Promise<void>;
  handleDeleteUser: () => Promise<void>;
  handleResetPassword: () => Promise<void>;
  openEditModal: (user: User) => void;
  resetForm: () => void;
}

export function useUserManagement(): UseUserManagementReturn {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'viewer',
    email: '',
    phone: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Audit logs
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await usersApi.getUsers(page, pageSize);
      if (result.code === 0 && result.data) {
        setUsers(result.data.list);
        setTotal(result.data.total);
      }
    } catch {
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const result = await usersApi.getAuditLogs(auditPage, 20);
      if (result.code === 0 && result.data) {
        setAuditLogs(result.data.list);
        setAuditTotal(result.data.total);
      }
    } catch {
      toast.error('获取审计日志失败');
    }
  }, [auditPage, toast]);

  useEffect(() => {
    if (showAuditLogs) {
      fetchAuditLogs();
    }
  }, [showAuditLogs, fetchAuditLogs]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      username: '',
      password: '',
      role: 'viewer',
      email: '',
      phone: '',
    });
    setSelectedUser(null);
  }, []);

  // Create user
  const handleCreateUser = useCallback(async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('请填写用户名和密码');
      return;
    }

    setFormLoading(true);
    try {
      const result = await usersApi.createUser(formData);
      if (result.code === 0) {
        toast.success('用户创建成功');
        setShowCreateModal(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(result.message || '创建失败');
      }
    } catch {
      toast.error('创建用户失败');
    } finally {
      setFormLoading(false);
    }
  }, [formData, toast, resetForm, fetchUsers]);

  // Update user
  const handleUpdateUser = useCallback(async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const updateData: UpdateUserRequest = {
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
      };
      const result = await usersApi.updateUser(selectedUser.id, updateData);
      if (result.code === 0) {
        toast.success('用户更新成功');
        setShowEditModal(false);
        resetForm();
        fetchUsers();
      } else {
        toast.error(result.message || '更新失败');
      }
    } catch {
      toast.error('更新用户失败');
    } finally {
      setFormLoading(false);
    }
  }, [selectedUser, formData, toast, resetForm, fetchUsers]);

  // Delete user
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const result = await usersApi.deleteUser(selectedUser.id);
      if (result.code === 0) {
        toast.success('用户删除成功');
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch {
      toast.error('删除用户失败');
    } finally {
      setFormLoading(false);
    }
  }, [selectedUser, toast, fetchUsers]);

  // Reset password
  const handleResetPassword = useCallback(async () => {
    if (!selectedUser || !newPassword.trim()) {
      toast.error('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }

    setFormLoading(true);
    try {
      const result = await usersApi.resetPassword(selectedUser.id, { new_password: newPassword });
      if (result.code === 0) {
        toast.success('密码重置成功');
        setShowResetPasswordModal(false);
        setNewPassword('');
        setSelectedUser(null);
      } else {
        toast.error(result.message || '重置失败');
      }
    } catch {
      toast.error('重置密码失败');
    } finally {
      setFormLoading(false);
    }
  }, [selectedUser, newPassword, toast]);

  // Open edit modal
  const openEditModal = useCallback((user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
    });
    setShowEditModal(true);
  }, []);

  return {
    users,
    loading,
    total,
    page,
    auditLogs,
    auditTotal,
    auditPage,
    showAuditLogs,
    formData,
    selectedUser,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showResetPasswordModal,
    formLoading,
    newPassword,
    fetchUsers,
    setPage,
    setAuditPage,
    setShowAuditLogs,
    setShowCreateModal,
    setShowEditModal,
    setShowDeleteConfirm,
    setShowResetPasswordModal,
    setFormData,
    setSelectedUser,
    setNewPassword,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleResetPassword,
    openEditModal,
    resetForm,
  };
}