import { useState, useCallback } from 'react';
import { sftpApi } from '@/services/api';
import type { SFTPFile } from '@/services/api';
import type { TransferLog } from '../types';

interface UseFileOperationsProps {
  hostId: number;
  currentPath: string;
  onLog: (type: TransferLog['type'], message: string, path: string, status: TransferLog['status'], size?: string) => void;
  onSuccess: (title: string, message: string) => void;
  onError: (title: string, message: string) => void;
  onRefresh: () => void;
}

export const useFileOperations = ({
  hostId,
  currentPath,
  onLog,
  onSuccess,
  onError,
  onRefresh
}: UseFileOperationsProps) => {
  const [editingFile, setEditingFile] = useState<SFTPFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);

  const createFolder = useCallback(async (folderName: string) => {
    if (!folderName.trim()) return false;
    const newPath = `${currentPath}/${folderName}`.replace(/\/+/g, '/');
    try {
      const response = await sftpApi.createDirectory(hostId, newPath);
      if (response.success) {
        onSuccess('创建成功', '目录已创建');
        onLog('mkdir', `创建目录: ${folderName}`, newPath, 'success');
        onRefresh();
        return true;
      } else {
        onError('创建失败', response.message || '无法创建目录');
        onLog('mkdir', `创建目录失败: ${folderName}`, newPath, 'error');
        return false;
      }
    } catch (err) {
      onError('创建失败', (err as Error).message);
      onLog('mkdir', `创建目录错误: ${(err as Error).message}`, newPath, 'error');
      return false;
    }
  }, [hostId, currentPath, onLog, onSuccess, onError, onRefresh]);

  const deleteFile = useCallback(async (file: SFTPFile) => {
    if (!confirm(`确定要删除 ${file.name} 吗？`)) return false;
    try {
      const response = await sftpApi.remove(hostId, file.path, file.is_dir);
      if (response.success) {
        onSuccess('删除成功', `${file.name} 已删除`);
        onLog('delete', `删除${file.is_dir ? '目录' : '文件'}: ${file.name}`, file.path, 'success', file.size_formatted);
        onRefresh();
        return true;
      } else {
        onError('删除失败', response.message || '无法删除');
        onLog('delete', `删除失败: ${file.name}`, file.path, 'error');
        return false;
      }
    } catch (err) {
      onError('删除失败', (err as Error).message);
      onLog('delete', `删除错误: ${(err as Error).message}`, file.path, 'error');
      return false;
    }
  }, [hostId, onLog, onSuccess, onError, onRefresh]);

  const renameFile = useCallback(async (target: SFTPFile, newName: string) => {
    if (!newName.trim() || newName === target.name) return false;
    const parentPath = currentPath === '/' ? '' : currentPath;
    const newPath = `${parentPath}/${newName}`.replace(/\/+/g, '/');
    try {
      const response = await sftpApi.rename(hostId, target.path, newPath);
      if (response.success) {
        onSuccess('重命名成功', `${target.name} -> ${newName}`);
        onLog('rename', `重命名: ${target.name} -> ${newName}`, newPath, 'success');
        onRefresh();
        return true;
      } else {
        onError('重命名失败', response.message || '无法重命名');
        onLog('rename', `重命名失败: ${target.name}`, newPath, 'error');
        return false;
      }
    } catch (err) {
      onError('重命名失败', (err as Error).message);
      onLog('rename', `重命名错误: ${(err as Error).message}`, target.path, 'error');
      return false;
    }
  }, [hostId, currentPath, onLog, onSuccess, onError, onRefresh]);

  const readFile = useCallback(async (file: SFTPFile) => {
    const textExtensions = ['.txt', '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.py', '.sh', '.yml', '.yaml', '.conf', '.cfg', '.ini', '.log', '.html', '.css', '.xml'];
    const isTextFile = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isTextFile) return null;

    try {
      const response = await sftpApi.readFile(hostId, file.path);
      if (response.success) {
        setEditingFile(file);
        setFileContent(response.content);
        return response.content;
      } else {
        onError('读取失败', response.error || '无法读取文件');
        return null;
      }
    } catch (err) {
      onError('读取失败', (err as Error).message);
      return null;
    }
  }, [hostId, onError]);

  const saveFile = useCallback(async () => {
    if (!editingFile) return false;
    try {
      setSaving(true);
      const response = await sftpApi.writeFile(hostId, editingFile.path, fileContent);
      if (response.success) {
        onSuccess('保存成功', '文件已保存');
        onRefresh();
        return true;
      } else {
        onError('保存失败', response.message || '无法保存文件');
        return false;
      }
    } catch (err) {
      onError('保存失败', (err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [hostId, editingFile, fileContent, onSuccess, onError, onRefresh]);

  const closeEditor = useCallback(() => {
    setEditingFile(null);
    setFileContent('');
  }, []);

  return {
    editingFile,
    fileContent,
    saving,
    setFileContent,
    createFolder,
    deleteFile,
    renameFile,
    readFile,
    saveFile,
    closeEditor
  };
};
