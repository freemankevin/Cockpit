/**
 * 图标模块入口
 * 统一导出所有图标和 Icon 组件
 */

import type { IconProps, IconName, IconMap } from './types';
import { navigationIcons } from './navigation';
import { terminalIcons } from './terminal';
import { statusIcons } from './status';
import { authIcons } from './auth';
import { systemIcons } from './system';
import { fileIcons } from './file';

// 合并所有图标映射
const iconMap: IconMap = {
  ...navigationIcons,
  ...terminalIcons,
  ...statusIcons,
  ...authIcons,
  ...systemIcons,
  ...fileIcons,
} as IconMap;

/**
 * 统一图标组件
 * 使用方式: <Icon name="server" className="w-4 h-4" />
 */
export function Icon({ name, ...props }: IconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }
  return <IconComponent {...props} />;
}

// 导出类型
export type { IconProps, IconName, IconMap };

// 导出所有图标（直接从 lucide-react 导出）
export * from './navigation';
export * from './terminal';
export * from './status';
export * from './auth';
export * from './system';
export * from './file';

// 默认导出 Icon 组件
export default Icon;
