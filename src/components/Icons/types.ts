/**
 * 图标类型定义
 */

import type { LucideIcon, LucideProps } from 'lucide-react';

// 图标名称类型
export type IconName = 
  // 导航和操作
  | 'server' | 'users' | 'home' | 'settings' | 'logout' | 'menu' 
  | 'close' | 'chevronLeft' | 'chevronRight' | 'chevronUp' | 'chevronDown'
  | 'plus' | 'minus' | 'search' | 'filter' | 'refresh' | 'download' | 'upload'
  | 'copy' | 'check' | 'edit' | 'trash' | 'moreHorizontal' | 'moreVertical'
  | 'eye' | 'eyeOff'
  // 终端和连接
  | 'terminal' | 'folderOpen' | 'folder' | 'file' | 'fileText'
  | 'plug' | 'plugConnected' | 'plugDisconnected' | 'plugCheck' | 'plugX'
  // 状态
  | 'alertCircle' | 'alertTriangle' | 'info' | 'ban' | 'clock' | 'spinner'
  | 'circleCheck' | 'circleX' | 'circleAlert' | 'circleInfo' | 'circle'
  | 'triangleAlert'
  // 用户和认证
  | 'user' | 'lock' | 'key' | 'shield' | 'login' | 'shieldCheck'
  // 系统和硬件
  | 'hardDrive' | 'cpu' | 'monitor' | 'database' | 'tag'
  // 文件操作
  | 'fileUp' | 'fileDown' | 'folderPlus' | 'fileEdit'
  | 'arrowUp' | 'arrowDown' | 'arrowRight' | 'arrowLeft' | 'rotateLeft'
  | 'fileUpload' | 'folderUpload' | 'trashCan'
  // 其他
  | 'globe' | 'hash' | 'zap' | 'power' | 'layers' | 'activity' | 'trendingUp'
  | 'cloud' | 'cloudUpload' | 'cloudDownload' | 'save' | 'externalLink'
  | 'maximize' | 'minimize'
  // 日志和文档
  | 'journal' | 'scrollText' | 'fileText'
  // 工具
  | 'wrench' | 'inbox' | 'arrowRepeat';

// 图标属性类型
export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

// 图标映射表类型
export type IconMap = Record<IconName, LucideIcon>;