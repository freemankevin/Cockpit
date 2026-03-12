import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HostsGrid from './components/HostsGrid';
import AddHostModal from './components/AddHostModal';
import TerminalModal from './components/TerminalModal';
import SFTPModal from './components/SFTPModal';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { hostApi } from './services/api';
import type { SSHHost, HostStats, CreateHostRequest, UpdateHostRequest } from './types';

function App() {
  const [hosts, setHosts] = useState<SSHHost[]>([]);
  const [stats, setStats] = useState<HostStats>({ total: 0, online: 0, offline: 0, key_count: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSFTPOpen, setIsSFTPOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<SSHHost | null>(null);
  const [editingHost, setEditingHost] = useState<SSHHost | null>(null);
  const [copyingHost, setCopyingHost] = useState<SSHHost | null>(null);
  const { toasts, removeToast, success, error } = useToast();

  // 加载主机列表
  const loadHosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await hostApi.getAll();
      if (response.success && response.data) {
        setHosts(response.data);
      }
    } catch (err) {
      console.error('Failed to load hosts:', err);
      error('加载失败', '无法加载主机列表');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // 加载统计信息
  const loadStats = useCallback(async () => {
    try {
      const response = await hostApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadHosts();
    loadStats();
  }, [loadHosts, loadStats]);

  // 搜索主机
  useEffect(() => {
    const searchHosts = async () => {
      if (!searchQuery.trim()) {
        loadHosts();
        return;
      }
      try {
        const response = await hostApi.search(searchQuery);
        if (response.success && response.data) {
          setHosts(response.data);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    };

    const debounceTimer = setTimeout(searchHosts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, loadHosts]);

  // 添加主机
  const handleAddHost = async (data: CreateHostRequest) => {
    try {
      const response = await hostApi.create(data);
      if (response.success) {
        await loadHosts();
        await loadStats();
        setIsAddModalOpen(false);
        setCopyingHost(null);
        success('添加成功', '主机已成功添加');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add host:', err);
      error('添加失败', '无法添加主机，请检查配置');
      return false;
    }
  };

  // 更新主机
  const handleUpdateHost = async (id: number, data: UpdateHostRequest) => {
    try {
      console.log('handleUpdateHost 被调用, id:', id, 'data:', data);
      const response = await hostApi.update(id, data);
      console.log('API 响应:', response);
      if (response.success) {
        await loadHosts();
        await loadStats();
        setEditingHost(null);
        setIsAddModalOpen(false);
        success('更新成功', '主机信息已更新');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update host:', err);
      error('更新失败', '无法更新主机信息');
      return false;
    }
  };

  // 删除主机
  const handleDeleteHost = async (id: number) => {
    // 使用自定义确认对话框替代浏览器默认 alert
    if (!confirm('确定要删除此主机吗？此操作不可恢复。')) {
      return;
    }
    try {
      const response = await hostApi.delete(id);
      if (response.success) {
        await loadHosts();
        await loadStats();
        success('删除成功', '主机已删除');
      }
    } catch (err) {
      console.error('Failed to delete host:', err);
      error('删除失败', '无法删除主机');
    }
  };

  // 测试连接
  const handleTestConnection = async (id: number) => {
    try {
      const response = await hostApi.testConnection(id);
      if (response.success) {
        success('连接成功', 'SSH 连接测试通过');
        await loadHosts();
      } else {
        error('连接失败', response.message || '无法连接到主机');
      }
    } catch (err) {
      console.error('Test connection failed:', err);
      error('连接失败', '测试连接时发生错误');
    }
  };

  // 打开终端
  const handleOpenTerminal = (host: SSHHost) => {
    setSelectedHost(host);
    setIsTerminalOpen(true);
  };

  // 打开 SFTP
  const handleOpenSFTP = (host: SSHHost) => {
    console.log('[App] handleOpenSFTP called:', host);
    console.log('[App] Setting selectedHost and isSFTPOpen...');
    setSelectedHost(host);
    setIsSFTPOpen(true);
    console.log('[App] isSFTPOpen should be true now');
  };

  // 打开编辑模态框
  const handleEditHost = (host: SSHHost) => {
    setEditingHost(host);
    setCopyingHost(null);
    setIsAddModalOpen(true);
  };

  // 复制主机
  const handleCopyHost = (host: SSHHost) => {
    setEditingHost(null);
    setCopyingHost(host);
    setIsAddModalOpen(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingHost(null);
    setCopyingHost(null);
  };

  return (
    <div className="bg-[#F5F5F7] text-gray-900 h-screen overflow-hidden flex">
      {/* Sidebar */}
      <Sidebar hostCount={hosts.length} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#F5F5F7] relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
        
        {/* Header */}
        <Header
          stats={stats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddHost={() => setIsAddModalOpen(true)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 relative z-10">
          <HostsGrid
            hosts={hosts}
            loading={loading}
            onEdit={handleEditHost}
            onDelete={handleDeleteHost}
            onTestConnection={handleTestConnection}
            onOpenTerminal={handleOpenTerminal}
            onOpenSFTP={handleOpenSFTP}
            onAddHost={() => setIsAddModalOpen(true)}
            onCopyHost={handleCopyHost}
          />
        </div>
      </main>

      {/* Add Host Modal */}
      {isAddModalOpen && (
        <AddHostModal
          host={editingHost}
          copyingHost={copyingHost}
          onClose={handleCloseModal}
          onSubmit={async (data) => {
            if (editingHost) {
              return await handleUpdateHost(editingHost.id, data as UpdateHostRequest);
            } else {
              return await handleAddHost(data as CreateHostRequest);
            }
          }}
        />
      )}

      {/* Terminal Modal */}
      {isTerminalOpen && selectedHost && (
        <TerminalModal
          host={selectedHost}
          onClose={() => {
            setIsTerminalOpen(false);
            setSelectedHost(null);
          }}
        />
      )}

      {/* SFTP Modal */}
      {isSFTPOpen && selectedHost && (
        <SFTPModal
          host={selectedHost}
          onClose={() => {
            setIsSFTPOpen(false);
            setSelectedHost(null);
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
