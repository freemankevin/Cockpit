import { useState, useCallback, useRef } from 'react';
import type { SFTPFile, DownloadProgress } from '@/services/api';
import { sftpApi } from '@/services/api';
import { formatFileSize } from '../utils';
import type { TransferManager } from '../types';

interface UseDownloadManagerProps {
  hostId: number;
  transfer: TransferManager;
  onSuccess: (title: string, message: string, duration?: number) => void;
  onError: (title: string, message: string) => void;
}

// Single download task state
export interface DownloadTask {
  id: string;
  downloadId: string;
  taskId: string;
  filename: string;
  fileSize: number;
  progress: DownloadProgress;
  abortController: AbortController;
}

// Active download task interface
interface ActiveDownload {
  abortController: AbortController;
  taskId: string;
}

// Global storage for active downloads (supports concurrent downloads)
const activeDownloads = new Map<string, ActiveDownload>();

interface UseDownloadManagerReturn {
  // Multiple concurrent download tasks
  downloadTasks: DownloadTask[];
  // Dialog state for viewing task details
  viewingTask: DownloadTask | null;
  showDownloadProgress: boolean;
  setViewingTask: (task: DownloadTask | null) => void;
  setShowDownloadProgress: (show: boolean) => void;
  handleDownload: (file: SFTPFile) => Promise<void>;
  downloadFolder: (folder: SFTPFile) => Promise<void>;
  cancelDownload: (downloadId: string) => void;
}

const INITIAL_PROGRESS: DownloadProgress = {
  progress: 0,
  bytes_transferred: 0,
  total_bytes: 0,
  speed: '',
  stage: 'init',
  message: ''
};

// Maximum concurrent downloads
const MAX_CONCURRENT_DOWNLOADS = 10;

// Generate unique download ID
const generateDownloadId = () => Math.random().toString(36).substring(2, 10);

// Cancel download by ID
export const cancelDownloadById = (downloadId: string): string | null => {
  const download = activeDownloads.get(downloadId);
  if (download) {
    console.log(`[Download] Cancelling download: ${downloadId}`);
    download.abortController.abort();
    activeDownloads.delete(downloadId);
    return download.taskId;
  }
  return null;
};

export function useDownloadManager({
  hostId,
  transfer,
  onSuccess,
  onError
}: UseDownloadManagerProps): UseDownloadManagerReturn {
  // Multiple concurrent download tasks
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>([]);
  const [viewingTask, setViewingTask] = useState<DownloadTask | null>(null);
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);

  // Update a specific download task's progress
  const updateDownloadTaskProgress = useCallback((downloadId: string, progress: Partial<DownloadProgress>) => {
    setDownloadTasks(prev => prev.map(task => 
      task.downloadId === downloadId 
        ? { ...task, progress: { ...task.progress, ...progress } }
        : task
    ));
  }, []);

  // Remove a download task
  const removeDownloadTask = useCallback((downloadId: string) => {
    setDownloadTasks(prev => prev.filter(task => task.downloadId !== downloadId));
  }, []);

  // Cancel download
  const cancelDownload = useCallback((downloadId: string) => {
    cancelDownloadById(downloadId);
    removeDownloadTask(downloadId);
  }, [removeDownloadTask]);

  // Download handling with concurrent support
  const handleDownload = useCallback(async (file: SFTPFile) => {
    if (file.is_dir) {
      await downloadFolder(file);
      return;
    }
    
    // Check if concurrent download limit exceeded
    const activeDownloadCount = downloadTasks.filter(t =>
      t.progress.stage !== 'completed' && t.progress.stage !== 'error'
    ).length;
    
    if (activeDownloadCount >= MAX_CONCURRENT_DOWNLOADS) {
      onError(
        'Download Limit Exceeded',
        `You have ${activeDownloadCount} active downloads. Maximum allowed is ${MAX_CONCURRENT_DOWNLOADS} concurrent downloads. Please wait for some downloads to complete.`
      );
      return;
    }
    
    // Generate unique download ID
    const downloadId = generateDownloadId();
    
    // Get directory info
    const directory = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
    
    // Create AbortController for cancellation
    const abortController = new AbortController();
    
    // Create initial progress
    const initialProgress: DownloadProgress = {
      progress: 0,
      bytes_transferred: 0,
      total_bytes: file.size,
      speed: '',
      stage: 'init',
      message: 'Preparing to download...'
    };
    
    // Create transfer task
    const taskId = await transfer.createTransferTask('download', file.name, file.path, file.size, directory);
    transfer.updateTransferTask(taskId, { status: 'transferring', downloadId });
    
    // Create download task and add to list
    const newTask: DownloadTask = {
      id: taskId,
      downloadId,
      taskId,
      filename: file.name,
      fileSize: file.size,
      progress: initialProgress,
      abortController
    };
    
    setDownloadTasks(prev => [...prev, newTask]);
    
    // Store active download task
    activeDownloads.set(downloadId, {
      abortController,
      taskId
    });
    
    try {
      // Use download method with progress polling
      const { blob } = await sftpApi.downloadFileWithProgress(
        hostId,
        file.path,
        (progressInfo) => {
          // Check if download was cancelled
          if (!activeDownloads.has(downloadId)) {
            return;
          }
          
          // Update progress
          updateDownloadTaskProgress(downloadId, progressInfo);
          
          // Update task progress
          transfer.updateTransferTask(taskId, {
            progress: progressInfo.progress,
            transferred: progressInfo.bytes_transferred,
            size: progressInfo.total_bytes,
            speed: progressInfo.speed || '',
            status: progressInfo.stage === 'error' ? 'failed' :
                    progressInfo.stage === 'completed' ? 'completed' : 'transferring'
          });
        },
        file.size
      );
      
      // Check if cancelled during download
      if (!activeDownloads.has(downloadId)) {
        return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      setTimeout(() => {
        a.click();
        const cleanupDelay = file.size > 10 * 1024 * 1024 ? 1000 : 500;
        setTimeout(() => {
          if (a.parentNode) {
            document.body.removeChild(a);
          }
          window.URL.revokeObjectURL(url);
        }, cleanupDelay);
      }, 0);
      
      // Update final progress
      updateDownloadTaskProgress(downloadId, {
        progress: 100,
        bytes_transferred: file.size,
        stage: 'completed',
        message: 'Download complete'
      });
      
      // Keep task in list for a while then remove
      setTimeout(() => removeDownloadTask(downloadId), 3000);
      
      transfer.completeTransferTask(taskId, true);
      activeDownloads.delete(downloadId);
      onSuccess('Download Complete', `${file.name} downloaded successfully`);
      transfer.addTransferLog('download', `Downloaded: ${file.name}`, file.path, 'success', file.size_formatted, directory);
    } catch (err: any) {
      // Check if cancelled
      if (!activeDownloads.has(downloadId) || abortController.signal.aborted) {
        updateDownloadTaskProgress(downloadId, {
          stage: 'error',
          message: 'Download cancelled'
        });
        
        setTimeout(() => removeDownloadTask(downloadId), 3000);
        
        transfer.completeTransferTask(taskId, false, 'User cancelled');
        transfer.addTransferLog('download', `✗ Download cancelled: ${file.name}`, 'User cancelled the download', 'info', undefined, directory);
        return;
      }
      
      updateDownloadTaskProgress(downloadId, {
        stage: 'error',
        message: (err as Error).message
      });
      
      setTimeout(() => removeDownloadTask(downloadId), 5000);
      
      transfer.completeTransferTask(taskId, false, (err as Error).message);
      transfer.addTransferLog('download', `Download failed: ${file.name}`, (err as Error).message, 'error', undefined, directory);
      onError('Download Failed', (err as Error).message);
      activeDownloads.delete(downloadId);
    }
  }, [hostId, transfer, onSuccess, onError, updateDownloadTaskProgress, removeDownloadTask]);

  const downloadFolder = useCallback(async (folder: SFTPFile) => {
    // Get directory info
    const directory = folder.path.substring(0, folder.path.lastIndexOf('/')) || '/';
    
    const taskId = await transfer.createTransferTask('download', `${folder.name}.zip`, folder.path, 0, directory);
    transfer.updateTransferTask(taskId, { status: 'transferring' });
    
    onSuccess('Download Started', `Preparing ${folder.name}.zip...`, 2000);
    
    try {
      const blob = await sftpApi.downloadFolder(
        hostId, 
        folder.path,
        (progress, transferred, total) => {
          transfer.updateTransferTask(taskId, {
            progress,
            transferred,
            size: total,
            speed: ''
          });
        }
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      setTimeout(() => {
        a.click();
        setTimeout(() => {
          if (a.parentNode) {
            document.body.removeChild(a);
          }
          window.URL.revokeObjectURL(url);
        }, 500);
      }, 0);
      
      transfer.completeTransferTask(taskId, true);
      onSuccess('Download Complete', `${folder.name}.zip downloaded successfully`);
      transfer.addTransferLog('download', `Downloaded folder: ${folder.name}.zip`, folder.path, 'success', formatFileSize(blob.size), directory);
    } catch (err) {
      transfer.completeTransferTask(taskId, false, (err as Error).message);
      transfer.addTransferLog('download', `Download failed: ${folder.name}`, (err as Error).message, 'error', undefined, directory);
      onError('Download Failed', (err as Error).message);
    }
  }, [hostId, transfer, onSuccess, onError]);

  return {
    downloadTasks,
    viewingTask,
    showDownloadProgress,
    setViewingTask,
    setShowDownloadProgress,
    handleDownload,
    downloadFolder,
    cancelDownload,
  };
}

// Export for external use
export { activeDownloads };