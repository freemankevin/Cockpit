import { useState, useRef, useCallback } from 'react';
import { sftpApi } from '@/services/api';
import { formatFileSize } from '../utils';
import type { TransferManager } from '../types';
import type { DiskInfo, FileInfo } from '@/services/sftpApi';
import {
  UploadProgress,
  ActiveUpload,
  BackgroundUploadState,
  activeUploads,
  generateUploadId,
  cancelUploadById,
  INITIAL_PROGRESS,
  createProgressPolling,
  collectFiles,
  handleUploadComplete
} from './uploadUtils';

interface UseUploadManagerProps {
  hostId: number;
  currentPath: string;
  transfer: TransferManager;
  onSuccess: (title: string, message: string, duration?: number) => void;
  onError: (title: string, message: string) => void;
  onRefresh: () => void;
}

// Single upload task state
export interface UploadTask {
  id: string;
  uploadId: string;
  taskId: string;
  filename: string;
  fileSize: number;
  progress: UploadProgress;
  abortController: AbortController;
}

interface UseUploadManagerReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  folderInputRef: React.RefObject<HTMLInputElement>;
  handleUpload: () => void;
  handleUploadFolder: () => void;
  handleUploadFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDropUpload: (items: DataTransferItemList) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
  // Multiple concurrent upload tasks
  uploadTasks: UploadTask[];
  // Dialog state for viewing task details
  viewingTask: UploadTask | null;
  showUploadProgress: boolean;
  setViewingTask: (task: UploadTask | null) => void;
  setShowUploadProgress: (show: boolean) => void;
  // Disk space error dialog
  showDiskSpaceError: boolean;
  diskSpaceInfo: DiskInfo | null;
  diskSpaceFileInfo: FileInfo | null;
  diskSpaceErrorCode: 'DISK_SPACE_THRESHOLD_EXCEEDED' | 'DISK_SPACE_INSUFFICIENT' | null;
  closeDiskSpaceError: () => void;
}

export function useUploadManager({
  hostId,
  currentPath,
  transfer,
  onSuccess,
  onError,
  onRefresh
}: UseUploadManagerProps): UseUploadManagerReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Multiple concurrent upload tasks
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [viewingTask, setViewingTask] = useState<UploadTask | null>(null);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  
  // Disk space error dialog state
  const [showDiskSpaceError, setShowDiskSpaceError] = useState(false);
  const [diskSpaceInfo, setDiskSpaceInfo] = useState<DiskInfo | null>(null);
  const [diskSpaceFileInfo, setDiskSpaceFileInfo] = useState<FileInfo | null>(null);
  const [diskSpaceErrorCode, setDiskSpaceErrorCode] = useState<'DISK_SPACE_THRESHOLD_EXCEEDED' | 'DISK_SPACE_INSUFFICIENT' | null>(null);
  
  const closeDiskSpaceError = useCallback(() => {
    setShowDiskSpaceError(false);
    setDiskSpaceInfo(null);
    setDiskSpaceFileInfo(null);
    setDiskSpaceErrorCode(null);
  }, []);

  // Update a specific upload task's progress
  const updateUploadTaskProgress = useCallback((uploadId: string, progress: Partial<UploadProgress>) => {
    setUploadTasks(prev => prev.map(task => 
      task.uploadId === uploadId 
        ? { ...task, progress: { ...task.progress, ...progress } }
        : task
    ));
  }, []);

  // Remove an upload task
  const removeUploadTask = useCallback((uploadId: string) => {
    setUploadTasks(prev => prev.filter(task => task.uploadId !== uploadId));
  }, []);

  // Upload single file with real progress tracking - supports concurrent uploads
  const uploadFileWithProgress = useCallback(async (
    file: File,
    relativePath?: string
  ): Promise<boolean> => {
    const uploadId = generateUploadId();
    const fileName = relativePath || file.name;
    const filePath = `${currentPath}/${fileName}`;
    
    // Create transfer task
    const taskId = await transfer.createTransferTask(
      'upload',
      file.name,
      filePath,
      file.size,
      currentPath
    );

    // Store uploadId to task for cancellation
    transfer.updateTransferTask(taskId, { status: 'transferring', uploadId });
    transfer.addTransferLog(
      'upload',
      `Starting upload: ${fileName}`,
      filePath,
      'info',
      formatFileSize(file.size),
      currentPath
    );

    // Create AbortController for cancellation
    const abortController = new AbortController();

    // Create initial progress
    const initialProgress: UploadProgress = {
      progress: 0,
      bytes_transferred: 0,
      total_bytes: file.size,
      speed: '',
      stage: 'init',
      message: 'Preparing to upload...'
    };

    // Create upload task and add to list
    const newTask: UploadTask = {
      id: taskId,
      uploadId,
      taskId,
      filename: fileName,
      fileSize: file.size,
      progress: initialProgress,
      abortController
    };
    
    setUploadTasks(prev => [...prev, newTask]);

    // Store active upload task
    const activeUpload: ActiveUpload = {
      progressInterval: null,
      abortController,
      taskId
    };
    activeUploads.set(uploadId, activeUpload);

    // Create progress polling function
    const startProgressPolling = createProgressPolling({
      uploadId,
      taskId,
      fileName,
      filePath,
      fileSize: file.size,
      transfer,
      setUploadProgress: (progress) => updateUploadTaskProgress(uploadId, progress),
      setBackgroundUpload: () => {}, // Not used in multi-task mode
      setCurrentUploadId: () => {}, // Not used in multi-task mode
      setCurrentTaskId: () => {}, // Not used in multi-task mode
      abortController,
      directory: currentPath
    });

    let isCompleted = false;

    try {
      // Start progress polling
      startProgressPolling();

      // Send upload request with abort signal
      const response = await sftpApi.uploadFile(
        hostId,
        currentPath,
        file,
        relativePath,
        uploadId,
        abortController.signal
      );

      // Stop polling
      const upload = activeUploads.get(uploadId);
      if (upload?.progressInterval) {
        clearInterval(upload.progressInterval);
        upload.progressInterval = null;
      }

      // If polling already handled completion, return immediately
      if (isCompleted) {
        return true;
      }

      // Clean up
      activeUploads.delete(uploadId);

      if (response.success) {
        // Update final progress
        updateUploadTaskProgress(uploadId, {
          progress: 100,
          bytes_transferred: file.size,
          stage: 'completed',
          message: 'Upload complete'
        });
        
        // Keep task in list for a while then remove
        setTimeout(() => removeUploadTask(uploadId), 3000);
        
        handleUploadComplete(
          true,
          fileName,
          filePath,
          file.size,
          taskId,
          transfer,
          () => {},
          () => {},
          () => {},
          () => {},
          undefined,
          currentPath
        );
        return true;
      } else {
        updateUploadTaskProgress(uploadId, {
          stage: 'error',
          message: response.message || 'Upload failed'
        });
        
        setTimeout(() => removeUploadTask(uploadId), 5000);
        
        handleUploadComplete(
          false,
          fileName,
          filePath,
          file.size,
          taskId,
          transfer,
          () => {},
          () => {},
          () => {},
          () => {},
          response.message,
          currentPath
        );
        return false;
      }
    } catch (err: any) {
      // Stop polling
      const upload = activeUploads.get(uploadId);
      if (upload?.progressInterval) {
        clearInterval(upload.progressInterval);
        upload.progressInterval = null;
      }

      // Clean up
      activeUploads.delete(uploadId);

      // If polling already handled completion, return immediately
      if (isCompleted) {
        return true;
      }

      // Check if user cancelled
      const isCancelled = err?.name === 'CanceledError' ||
                          err?.name === 'AbortError' ||
                          err?.code === 'ERR_CANCELED' ||
                          err?.message === 'canceled' ||
                          abortController.signal.aborted;

      if (isCancelled) {
        updateUploadTaskProgress(uploadId, {
          stage: 'error',
          message: 'Upload cancelled'
        });
        
        setTimeout(() => removeUploadTask(uploadId), 3000);
        
        transfer.completeTransferTask(taskId, false, 'User cancelled');
        transfer.addTransferLog(
          'upload',
          `✗ Upload cancelled: ${fileName}`,
          'User cancelled the upload',
          'info',
          undefined,
          currentPath
        );
        return false;
      }

      // Check for disk space error
      const uploadError = err?.uploadError;
      if (uploadError?.disk_info) {
        setDiskSpaceInfo(uploadError.disk_info);
        setDiskSpaceFileInfo(uploadError.file_info || null);
        setDiskSpaceErrorCode(uploadError.error_code || 'DISK_SPACE_INSUFFICIENT');
        setShowDiskSpaceError(true);
        
        updateUploadTaskProgress(uploadId, {
          stage: 'error',
          message: uploadError.error
        });
        
        setTimeout(() => removeUploadTask(uploadId), 5000);
        
        handleUploadComplete(
          false,
          fileName,
          filePath,
          file.size,
          taskId,
          transfer,
          () => {},
          () => {},
          () => {},
          () => {},
          uploadError.error,
          currentPath
        );
        return false;
      }

      updateUploadTaskProgress(uploadId, {
        stage: 'error',
        message: (err as Error).message
      });
      
      setTimeout(() => removeUploadTask(uploadId), 5000);
      
      handleUploadComplete(
        false,
        fileName,
        filePath,
        file.size,
        taskId,
        transfer,
        () => {},
        () => {},
        () => {},
        () => {},
        (err as Error).message,
        currentPath
      );
      return false;
    }
  }, [hostId, currentPath, transfer, updateUploadTaskProgress, removeUploadTask]);

  // Cancel upload
  const cancelUpload = useCallback((uploadId: string) => {
    cancelUploadById(uploadId);
    removeUploadTask(uploadId);
  }, [removeUploadTask]);

  const handleUpload = () => fileInputRef.current?.click();
  const handleUploadFolder = () => folderInputRef.current?.click();

  // Maximum concurrent uploads
  const MAX_CONCURRENT_UPLOADS = 10;

  // Handle file selection - supports concurrent uploads
  const handleUploadFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('[Upload] Files selected:', files.length);

    // Check if file count exceeds limit
    if (files.length > MAX_CONCURRENT_UPLOADS) {
      onError(
        'Upload Limit Exceeded',
        `You selected ${files.length} files. Maximum allowed is ${MAX_CONCURRENT_UPLOADS} files at a time. Please select fewer files.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
      return;
    }

    // Check if it's a folder upload
    const isFolderUpload = files[0].webkitRelativePath && files[0].webkitRelativePath.includes('/');

    if (isFolderUpload) {
      const rootFolderName = files[0].webkitRelativePath?.split('/')[0] || 'upload';
      onSuccess('Upload Started', `Uploading folder "${rootFolderName}" (${files.length} files)...`, 3000);

      // Upload all files concurrently (max 10 at a time)
      const results: boolean[] = [];
      
      for (let i = 0; i < files.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = Array.from(files).slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchResults = await Promise.all(
          batch.map(file => uploadFileWithProgress(file, file.webkitRelativePath))
        );
        results.push(...batchResults);
      }

      const successCount = results.filter(r => r).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        onSuccess('Upload Complete', `Folder "${rootFolderName}" uploaded (${successCount} files)`);
      } else {
        onError('Partial Upload Failed', `${successCount} files uploaded, ${failCount} failed`);
      }
    } else {
      // Regular file upload - upload concurrently
      onSuccess('Upload Started', `Uploading ${files.length} file(s)...`, 3000);
      
      const results: boolean[] = [];
      
      for (let i = 0; i < files.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = Array.from(files).slice(i, i + MAX_CONCURRENT_UPLOADS);
        const batchResults = await Promise.all(
          batch.map(file => uploadFileWithProgress(file))
        );
        results.push(...batchResults);
      }

      const successCount = results.filter(r => r).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        onSuccess('Upload Complete', `${successCount} file(s) uploaded successfully`);
      } else {
        onError('Partial Upload Failed', `${successCount} files uploaded, ${failCount} failed`);
      }
    }

    onRefresh();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  }, [uploadFileWithProgress, onSuccess, onError, onRefresh]);

  // Handle drag and drop upload - supports concurrent uploads
  const handleDropUpload = useCallback(async (items: DataTransferItemList) => {
    const entries: FileSystemEntry[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          entries.push(entry);
        }
      }
    }

    if (entries.length === 0) return;

    // Collect all files
    const allFiles: { file: File; relativePath: string }[] = [];
    for (const entry of entries) {
      const files = await collectFiles(entry);
      allFiles.push(...files);
    }

    if (allFiles.length === 0) {
      onError('No Files', 'No files found to upload');
      return;
    }

    // Check if file count exceeds limit
    if (allFiles.length > MAX_CONCURRENT_UPLOADS) {
      onError(
        'Upload Limit Exceeded',
        `You selected ${allFiles.length} files. Maximum allowed is ${MAX_CONCURRENT_UPLOADS} files at a time. Please select fewer files.`
      );
      return;
    }

    onSuccess('Upload Started', `Uploading ${allFiles.length} files...`, 3000);

    // Upload concurrently (max 10 at a time)
    const results: boolean[] = [];
    
    for (let i = 0; i < allFiles.length; i += MAX_CONCURRENT_UPLOADS) {
      const batch = allFiles.slice(i, i + MAX_CONCURRENT_UPLOADS);
      const batchResults = await Promise.all(
        batch.map(({ file, relativePath }) => uploadFileWithProgress(file, relativePath))
      );
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      onSuccess('Upload Complete', `${successCount} files uploaded successfully`);
    } else {
      onError('Partial Upload Failed', `${successCount} files uploaded, ${failCount} failed`);
    }

    onRefresh();
  }, [uploadFileWithProgress, onSuccess, onError, onRefresh]);

  return {
    fileInputRef,
    folderInputRef,
    handleUpload,
    handleUploadFolder,
    handleUploadFileSelect,
    handleDropUpload,
    cancelUpload,
    uploadTasks,
    viewingTask,
    showUploadProgress,
    setViewingTask,
    setShowUploadProgress,
    // Disk space error dialog
    showDiskSpaceError,
    diskSpaceInfo,
    diskSpaceFileInfo,
    diskSpaceErrorCode,
    closeDiskSpaceError,
  };
}

// Re-export for external use
export { cancelUploadById } from './uploadUtils';
export type { TransferManager } from '../types';