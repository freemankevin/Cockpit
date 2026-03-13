import { Folder, File, FileCode, FileJson, FileText, Terminal, Image, FileArchive, FileSpreadsheet, Settings, Link2 } from 'lucide-react';
import type { SFTPFile } from '@/services/api';

interface FileIconProps {
  file: SFTPFile;
  size?: 'sm' | 'md' | 'lg';
}

const FileIcon = ({ file, size = 'md' }: FileIconProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  const iconSize = sizeClasses[size];

  // 链接文件显示链接图标
  if (file.is_link) {
    return (
      <div className={`${iconSize} rounded-md bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm relative`}>
        <Link2 className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} text-white`} />
        {/* 小链接标记 */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-purple-300 rounded-full border border-white" />
      </div>
    );
  }

  if (file.is_dir) {
    return (
      <div className={`${iconSize} rounded-md bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm`}>
        <Folder className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} text-white`} />
      </div>
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const iconConfig: Record<string, { icon: typeof File; color: string; bg: string }> = {
    js: { icon: FileCode, color: 'text-yellow-600', bg: 'from-yellow-100 to-yellow-200' },
    ts: { icon: FileCode, color: 'text-blue-600', bg: 'from-blue-100 to-blue-200' },
    jsx: { icon: FileCode, color: 'text-cyan-600', bg: 'from-cyan-100 to-cyan-200' },
    tsx: { icon: FileCode, color: 'text-blue-500', bg: 'from-blue-100 to-blue-200' },
    json: { icon: FileJson, color: 'text-gray-600', bg: 'from-gray-100 to-gray-200' },
    md: { icon: FileText, color: 'text-purple-600', bg: 'from-purple-100 to-purple-200' },
    py: { icon: FileCode, color: 'text-green-600', bg: 'from-green-100 to-green-200' },
    sh: { icon: Terminal, color: 'text-gray-700', bg: 'from-gray-200 to-gray-300' },
    yml: { icon: FileText, color: 'text-red-500', bg: 'from-red-100 to-red-200' },
    yaml: { icon: FileText, color: 'text-red-500', bg: 'from-red-100 to-red-200' },
    html: { icon: FileCode, color: 'text-orange-600', bg: 'from-orange-100 to-orange-200' },
    css: { icon: FileCode, color: 'text-blue-400', bg: 'from-blue-50 to-blue-100' },
    png: { icon: Image, color: 'text-purple-500', bg: 'from-purple-100 to-purple-200' },
    jpg: { icon: Image, color: 'text-purple-500', bg: 'from-purple-100 to-purple-200' },
    jpeg: { icon: Image, color: 'text-purple-500', bg: 'from-purple-100 to-purple-200' },
    gif: { icon: Image, color: 'text-purple-500', bg: 'from-purple-100 to-purple-200' },
    svg: { icon: Image, color: 'text-purple-500', bg: 'from-purple-100 to-purple-200' },
    zip: { icon: FileArchive, color: 'text-amber-600', bg: 'from-amber-100 to-amber-200' },
    tar: { icon: FileArchive, color: 'text-amber-600', bg: 'from-amber-100 to-amber-200' },
    gz: { icon: FileArchive, color: 'text-amber-600', bg: 'from-amber-100 to-amber-200' },
    csv: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'from-green-100 to-green-200' },
    xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'from-green-100 to-green-200' },
    xls: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'from-green-100 to-green-200' },
    txt: { icon: FileText, color: 'text-gray-500', bg: 'from-gray-100 to-gray-200' },
    log: { icon: FileText, color: 'text-gray-500', bg: 'from-gray-100 to-gray-200' },
    conf: { icon: Settings, color: 'text-gray-600', bg: 'from-gray-100 to-gray-200' },
    cfg: { icon: Settings, color: 'text-gray-600', bg: 'from-gray-100 to-gray-200' },
    ini: { icon: Settings, color: 'text-gray-600', bg: 'from-gray-100 to-gray-200' },
  };

  const config = iconConfig[ext] || { icon: File, color: 'text-gray-400', bg: 'from-gray-50 to-gray-100' };
  const IconComponent = config.icon;

  return (
    <div className={`${iconSize} rounded-md bg-gradient-to-br ${config.bg} flex items-center justify-center shadow-sm`}>
      <IconComponent className={`${size === 'lg' ? 'w-5 h-5' : 'w-3 h-3'} ${config.color}`} />
    </div>
  );
};

export default FileIcon;
