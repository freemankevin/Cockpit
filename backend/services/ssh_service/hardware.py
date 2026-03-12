"""
硬件检测模块
检测远程系统的 CPU、内存、磁盘等硬件信息
"""

from typing import Dict, Any, Optional, TYPE_CHECKING

from utils.logger import get_logger

if TYPE_CHECKING:
    import paramiko

logger = get_logger(__name__)


class HardwareDetector:
    """硬件检测器类"""

    def __init__(self, client: Optional["paramiko.SSHClient"]):
        self.client = client
        self.system_info: Dict[str, Any] = {}

    def detect_hardware(self) -> Dict[str, Any]:
        """检测硬件信息"""
        if not self.client:
            return {}
        
        try:
            # 获取 CPU 核心数
            self._detect_cpu_cores()
            
            # 获取内存信息
            self._detect_memory()
            
            # 获取内核版本
            self._detect_kernel_version()

            # 获取磁盘信息
            self._get_disk_info()

        except Exception as e:
            logger.warning(f"硬件信息获取失败 | {e}")
            self.system_info.setdefault('cpu_cores', None)
            self.system_info.setdefault('memory_gb', None)
            self.system_info.setdefault('kernel_version', None)
        
        return self.system_info

    def _detect_cpu_cores(self):
        """检测 CPU 核心数"""
        if not self.client:
            return
            
        cpu_cores = 0
        try:
            stdin, stdout, stderr = self.client.exec_command('nproc 2>/dev/null')
            output = stdout.read().decode().strip()
            if output and output.isdigit():
                cpu_cores = int(output)
        except Exception:
            pass

        if cpu_cores == 0:
            try:
                stdin, stdout, stderr = self.client.exec_command(
                    'grep -c ^processor /proc/cpuinfo 2>/dev/null'
                )
                output = stdout.read().decode().strip()
                if output and output.isdigit():
                    cpu_cores = int(output)
            except Exception:
                pass

        self.system_info['cpu_cores'] = cpu_cores if cpu_cores > 0 else None

    def _detect_memory(self):
        """检测内存信息"""
        if not self.client:
            return
            
        memory_gb = 0
        
        # 方法1: 使用 free 命令
        try:
            stdin, stdout, stderr = self.client.exec_command(
                "free -m | grep Mem | awk '{print $2}'"
            )
            output = stdout.read().decode().strip()
            if output:
                try:
                    memory_mb = float(output)
                    memory_gb = round(memory_mb / 1024, 1)
                except ValueError:
                    pass
        except Exception:
            pass

        if memory_gb == 0:
            # 方法2: 使用 /proc/meminfo
            try:
                stdin, stdout, stderr = self.client.exec_command(
                    "cat /proc/meminfo | grep MemTotal | awk '{print $2}'"
                )
                output = stdout.read().decode().strip()
                if output:
                    try:
                        memory_kb = float(output)
                        memory_gb = round(memory_kb / (1024 * 1024), 1)
                    except ValueError:
                        pass
            except Exception:
                pass

        if memory_gb == 0:
            # 方法3: 使用 vmstat
            try:
                stdin, stdout, stderr = self.client.exec_command(
                    "vmstat -s | grep 'total memory' | awk '{print $1}'"
                )
                output = stdout.read().decode().strip()
                if output:
                    try:
                        memory_pages = float(output)
                        memory_gb = round((memory_pages * 4) / (1024 * 1024), 1)
                    except ValueError:
                        pass
            except Exception:
                pass

        self.system_info['memory_gb'] = memory_gb if memory_gb > 0 else None

    def _detect_kernel_version(self):
        """检测内核版本"""
        if not self.client:
            return
            
        try:
            stdin, stdout, stderr = self.client.exec_command('uname -r 2>/dev/null')
            kernel_version = stdout.read().decode().strip()
            if kernel_version:
                self.system_info['kernel_version'] = kernel_version
            else:
                self.system_info['kernel_version'] = None
        except Exception:
            self.system_info['kernel_version'] = None

    def _get_disk_info(self):
        """获取磁盘信息 - 区分系统盘和数据盘"""
        if not self.client:
            return
            
        try:
            # 获取系统盘信息
            system_disk_total, system_disk_used = self._get_system_disk_info()
            
            # 获取数据盘信息 (现在返回3个值)
            data_disk_total, data_disk_used, data_disk_name = self._get_data_disk_info()

            # 设置系统盘信息
            if system_disk_total > 0:
                self.system_info['system_disk_total'] = system_disk_total
                self.system_info['system_disk_used'] = system_disk_used if system_disk_used > 0 else 0
            else:
                self.system_info['system_disk_total'] = None
                self.system_info['system_disk_used'] = None

            # 设置数据盘信息
            if data_disk_total > 0:
                self.system_info['data_disk_total'] = data_disk_total
                self.system_info['data_disk_used'] = data_disk_used if data_disk_used > 0 else 0
                self.system_info['data_disk_name'] = data_disk_name  # 新增：数据盘设备名
            else:
                self.system_info['data_disk_total'] = None
                self.system_info['data_disk_used'] = None
                self.system_info['data_disk_name'] = None

            logger.info(f"磁盘信息 | 系统盘={system_disk_total}GB, 数据盘={data_disk_total}GB, 设备={data_disk_name}")

        except Exception as e:
            logger.warning(f"磁盘信息获取失败 | {e}")
            self.system_info['system_disk_total'] = None
            self.system_info['system_disk_used'] = None
            self.system_info['data_disk_total'] = None
            self.system_info['data_disk_used'] = None
            self.system_info['data_disk_name'] = None

    def _get_system_disk_info(self) -> tuple:
        """获取系统盘信息"""
        if not self.client:
            return (0, 0)
            
        system_disk_total = 0
        system_disk_used = 0

        # 方法1: 使用 df -h
        try:
            stdin, stdout, stderr = self.client.exec_command(
                "df -h / 2>/dev/null | tail -1"
            )
            output = stdout.read().decode().strip()
            if output:
                parts = output.split()
                if len(parts) >= 3:
                    total_str = parts[1]
                    used_str = parts[2]
                    system_disk_total = self._parse_disk_size(total_str)
                    system_disk_used = self._parse_disk_size(used_str)
                    logger.debug(f"df -h / 输出: {output}, 解析结果: total={system_disk_total}, used={system_disk_used}")
        except Exception as e:
            logger.debug(f"获取系统盘信息失败(方法1): {e}")

        # 方法2: 使用 df -B1
        if system_disk_total == 0:
            try:
                stdin, stdout, stderr = self.client.exec_command(
                    "df -B1 / 2>/dev/null | tail -1"
                )
                output = stdout.read().decode().strip()
                if output:
                    parts = output.split()
                    if len(parts) >= 3:
                        total_bytes = int(parts[1])
                        used_bytes = int(parts[2])
                        system_disk_total = round(total_bytes / (1024**3), 1)
                        system_disk_used = round(used_bytes / (1024**3), 1)
                        logger.debug(f"df -B1 / 输出: 总容量={system_disk_total}GB, 已用={system_disk_used}GB")
            except Exception as e:
                logger.debug(f"获取系统盘信息失败(方法2): {e}")

        # 方法3: 使用 lsblk
        if system_disk_total == 0:
            try:
                stdin, stdout, stderr = self.client.exec_command(
                    "lsblk -b -o SIZE,MOUNTPOINT,TYPE 2>/dev/null | grep '/$' | head -1"
                )
                output = stdout.read().decode().strip()
                if output:
                    parts = output.split()
                    if len(parts) >= 1:
                        size_bytes = int(parts[0])
                        system_disk_total = round(size_bytes / (1024**3), 1)
                        # 获取已用空间
                        stdin, stdout, stderr = self.client.exec_command(
                            "df -B1 / 2>/dev/null | tail -1 | awk '{print $3}'"
                        )
                        used_output = stdout.read().decode().strip()
                        if used_output:
                            used_bytes = int(used_output)
                            system_disk_used = round(used_bytes / (1024**3), 1)
            except Exception as e:
                logger.debug(f"获取系统盘信息失败(方法3): {e}")

        # 方法4: 使用 stat
        if system_disk_total == 0:
            try:
                stdin, stdout, stderr = self.client.exec_command(
                    "stat -f -c '%S %b %a' / 2>/dev/null"
                )
                output = stdout.read().decode().strip()
                if output:
                    parts = output.split()
                    if len(parts) >= 3:
                        block_size = int(parts[0])
                        total_blocks = int(parts[1])
                        avail_blocks = int(parts[2])
                        total_bytes = block_size * total_blocks
                        avail_bytes = block_size * avail_blocks
                        used_bytes = total_bytes - avail_bytes
                        system_disk_total = round(total_bytes / (1024**3), 1)
                        system_disk_used = round(used_bytes / (1024**3), 1)
            except Exception as e:
                logger.debug(f"获取系统盘信息失败(方法4): {e}")

        return (system_disk_total, system_disk_used)

    def _get_data_disk_info(self) -> tuple:
        """获取数据盘信息 - 返回 (总容量, 已用容量, 设备名称)"""
        if not self.client:
            return (0, 0, None)
            
        data_disk_total = 0
        data_disk_used = 0
        data_disk_name = None

        try:
            # 获取所有分区信息，包括设备名、大小、挂载点
            # 格式: 设备名 总大小 已用大小 挂载点
            stdin, stdout, stderr = self.client.exec_command(
                "df -h 2>/dev/null | grep -vE '^Filesystem|tmpfs|devtmpfs|overlay|/boot|/efi|snap' | awk '{print $1,$2,$3,$6}'"
            )
            output = stdout.read().decode().strip()

            if output:
                lines = output.split('\n')
                disks = []

                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 4:
                        try:
                            device = parts[0]  # 如 /dev/sdb1
                            total = self._parse_disk_size(parts[1])
                            used = self._parse_disk_size(parts[2])
                            mount_point = parts[3]

                            # 排除根分区
                            if mount_point != '/' and total > 0:
                                # 提取设备名中的字母部分用于排序 (如 sdb, sdc, vdb, vdc)
                                import re
                                match = re.search(r'[sv]d([a-z])\d*', device)
                                if match:
                                    disk_letter = match.group(1)
                                    disks.append({
                                        'device': device,
                                        'letter': disk_letter,
                                        'total': total,
                                        'used': used,
                                        'mount_point': mount_point
                                    })
                        except Exception:
                            continue
                
                # 按磁盘字母排序 (b, c, d...)
                disks.sort(key=lambda x: x['letter'])
                
                # 选择第一个磁盘（按字母排序最前的）
                if disks:
                    first_disk = disks[0]
                    data_disk_total = first_disk['total']
                    data_disk_used = first_disk['used']
                    data_disk_name = first_disk['device'].split('/')[-1]  # 只保留设备名，如 sdb1
                    
                    logger.info(f"数据盘选择 | 设备: {data_disk_name}, 字母: {first_disk['letter']}, 大小: {data_disk_total}GB")
                    
                    # 如果有多个数据盘，记录所有磁盘信息
                    if len(disks) > 1:
                        all_disks = [f"{d['device'].split('/')[-1]}({d['letter']}):{d['total']}G" for d in disks]
                        logger.info(f"所有数据盘: {', '.join(all_disks)}")
                        
        except Exception as e:
            logger.debug(f"获取数据盘信息失败: {e}")

        return (data_disk_total, data_disk_used, data_disk_name)

    @staticmethod
    def _parse_disk_size(size_str: str) -> float:
        """解析磁盘大小字符串，返回 GB 数值"""
        if not size_str:
            return 0

        size_str = size_str.strip().upper()
        size_str = size_str.replace(',', '')

        try:
            if size_str.endswith('T'):
                return float(size_str[:-1]) * 1024
            elif size_str.endswith('G'):
                return float(size_str[:-1])
            elif size_str.endswith('M'):
                return float(size_str[:-1]) / 1024
            elif size_str.endswith('K'):
                return float(size_str[:-1]) / (1024 * 1024)
            elif size_str.endswith('B'):
                return float(size_str[:-1]) / (1024 ** 3)
            else:
                try:
                    return float(size_str) / (1024 ** 3)
                except Exception:
                    return 0
        except ValueError:
            return 0