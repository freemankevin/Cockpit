/**
 * SFTP Icons - 使用 Lucide React 图标库
 */
import { FileUp, FolderUp } from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
}

// File upload icon - file with upward arrow
export const FileUploadIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <FileUp className={className} size={size} />
);

// Folder upload icon - folder with upward arrow
export const FolderUploadIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <FolderUp className={className} size={size} />
);