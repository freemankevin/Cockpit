import { useState, useCallback, useEffect, useRef } from 'react';
import { usersApi } from '../../services/authApi';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../types';
import { useToast } from '../../hooks/useToast';

// Module-level cache for user data (persists across component mounts)
interface UserCache {
  users: User[];
  total: number;
  page: number;
  timestamp: number;
}

let userCache: UserCache | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

interface UseUserManagementReturn {
  users: User[];
  loading: boolean;
  total: number;
  page: number;
  formData: CreateUserRequest;
  selectedUser: User | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteConfirm: boolean;
  showResetPasswordModal: boolean;
  formLoading: boolean;
  newPassword: string;
  confirmPassword: string;
  fetchUsers: () => Promise<void>;
  setPage: (page: number) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setShowResetPasswordModal: (show: boolean) => void;
  setFormData: (data: CreateUserRequest) => void;
  setSelectedUser: (user: User | null) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  handleCreateUser: () => Promise<void>;
  handleUpdateUser: () => Promise<void>;
  handleDeleteUser: () => Promise<void>;
  handleResetPassword: () => Promise<void>;
  handleUserAvatarUpdate: (user: User) => void;
  openEditModal: (user: User) => void;
  resetForm: () => void;
}

export function useUserManagement(): UseUserManagementReturn {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>(() => {
    // Initialize with cached data if available and valid
    if (userCache && Date.now() - userCache.timestamp < CACHE_TTL) {
      return userCache.users;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if no valid cache exists
    return !userCache || Date.now() - userCache.timestamp >= CACHE_TTL;
  });
  const [total, setTotal] = useState(() => {
    if (userCache && Date.now() - userCache.timestamp < CACHE_TTL) {
      return userCache.total;
    }
    return 0;
  });
  const [page, setPage] = useState(() => {
    if (userCache && Date.now() - userCache.timestamp < CACHE_TTL) {
      return userCache.page;
    }
    return 1;
  });
  const pageSize = 20;
  const initialLoadDone = useRef(false);

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch users with cache support
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    // Check if we have valid cache and not forcing refresh
    const hasValidCache = userCache && Date.now() - userCache.timestamp < CACHE_TTL;
    
    if (hasValidCache && !forceRefresh && userCache) {
      // Use cached data, no loading spinner needed
      setUsers(userCache.users);
      setTotal(userCache.total);
      setLoading(false);
      return;
    }

    // Show loading only if no cached data to display
    if (users.length === 0) {
      setLoading(true);
    }
    
    try {
      const result = await usersApi.getUsers(page, pageSize);
      if (result.code === 0 && result.data) {
        const newUsers = result.data.list;
        const newTotal = result.data.total;
        setUsers(newUsers);
        setTotal(newTotal);
        // Update cache
        userCache = {
          users: newUsers,
          total: newTotal,
          page: page,
          timestamp: Date.now(),
        };
      }
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, users.length]);

  // Initial load: use cache if valid, otherwise fetch
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchUsers();
    }
  }, [fetchUsers]);

  // Refetch when page changes (force refresh)
  useEffect(() => {
    if (initialLoadDone.current && userCache?.page !== page) {
      fetchUsers(true);
    }
  }, [page]);

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
        fetchUsers(true); // Force refresh after create
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
        fetchUsers(true); // Force refresh after update
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
        fetchUsers(true); // Force refresh after delete
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

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setFormLoading(true);
    try {
      const result = await usersApi.resetPassword(selectedUser.id, { new_password: newPassword });
      if (result.code === 0) {
        toast.success('密码重置成功');
        setShowResetPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedUser(null);
      } else {
        toast.error(result.message || '重置失败');
      }
    } catch {
      toast.error('重置密码失败');
    } finally {
      setFormLoading(false);
    }
  }, [selectedUser, newPassword, confirmPassword, toast]);

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

  // Handle user avatar update - update the user in the list
  const handleUserAvatarUpdate = useCallback((updatedUser: User) => {
    // Update the user in the local list
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
    // Update cache
    if (userCache) {
      userCache = {
        ...userCache,
        users: userCache.users.map(u => u.id === updatedUser.id ? updatedUser : u),
        timestamp: Date.now(),
      };
    }
    // Update selectedUser if it's the same user
    if (selectedUser?.id === updatedUser.id) {
      setSelectedUser(updatedUser);
    }
  }, [selectedUser]);

  return {
    users,
    loading,
    total,
    page,
    formData,
    selectedUser,
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    showResetPasswordModal,
    formLoading,
    newPassword,
    confirmPassword,
    fetchUsers,
    setPage,
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
  };
}