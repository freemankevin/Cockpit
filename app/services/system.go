package services

import (
	"fmt"
	"strings"

	"deploy-master/config"
)

// GetSystemInfo 获取系统信息
func GetSystemInfo(hostID uint) (*config.SystemInfo, error) {
	_, exists := config.Pool.Get(hostID)
	if !exists {
		return nil, fmt.Errorf("not connected")
	}

	info := &config.SystemInfo{}

	// 获取系统信息
	commands := map[string]string{
		"hostname": "hostname",
		"kernel":   "uname -r",
		"os":       "cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'\"' -f2 || uname -s",
		"uptime":   "uptime -p 2>/dev/null || uptime",
		"cpu":      "cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2 | xargs",
		"memory":   "free -h | grep Mem | awk '{print $2\" / \"$3\" used\"}'",
		"disk":     "df -h / | tail -1 | awk '{print $2\" / \"$3\" used\"}'",
		"ip":       "hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 | awk '{print $7}'",
	}

	for key, cmd := range commands {
		output, err := config.Pool.ExecuteCommand(hostID, cmd)
		if err == nil {
			switch key {
			case "hostname":
				info.Hostname = strings.TrimSpace(output)
			case "kernel":
				info.Kernel = strings.TrimSpace(output)
			case "os":
				info.OS = strings.TrimSpace(output)
			case "uptime":
				info.Uptime = strings.TrimSpace(output)
			case "cpu":
				info.CPU = strings.TrimSpace(output)
			case "memory":
				info.Memory = strings.TrimSpace(output)
			case "disk":
				info.Disk = strings.TrimSpace(output)
			case "ip":
				info.IP = strings.TrimSpace(output)
			}
		}
	}

	// 获取发行版信息
	if distroInfo, err := getDistroInfo(hostID); err == nil {
		info.Distro = distroInfo["ID"]
		info.DistroLike = distroInfo["ID_LIKE"]
		info.Version = distroInfo["VERSION_ID"]
	}

	return info, nil
}

// GetHardwareInfo 获取硬件信息
func GetHardwareInfo(hostID uint) (*config.HardwareInfo, error) {
	_, exists := config.Pool.Get(hostID)
	if !exists {
		return nil, fmt.Errorf("not connected")
	}

	info := &config.HardwareInfo{}

	// CPU 信息
	info.CPU = getCPUInfo(hostID)

	// 内存信息
	info.Memory = getMemoryInfo(hostID)

	// 磁盘信息
	info.Disks = getDiskInfo(hostID)

	// 网络信息
	info.Network = getNetworkInfo(hostID)

	return info, nil
}

func getDistroInfo(hostID uint) (map[string]string, error) {
	output, err := config.Pool.ExecuteCommand(hostID, "cat /etc/os-release 2>/dev/null")
	if err != nil {
		return nil, err
	}

	info := make(map[string]string)
	for _, line := range strings.Split(output, "\n") {
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := parts[0]
			value := strings.Trim(parts[1], "\"")
			info[key] = value
		}
	}

	return info, nil
}

func getCPUInfo(hostID uint) config.CPUInfo {
	info := config.CPUInfo{}

	// CPU 型号
	output, err := config.Pool.ExecuteCommand(hostID, "cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2 | xargs")
	if err == nil {
		info.Model = strings.TrimSpace(output)
	}

	// 核心数
	output, err = config.Pool.ExecuteCommand(hostID, "nproc")
	if err == nil {
		var cores int
		fmt.Sscanf(output, "%d", &cores)
		info.Cores = cores
		info.Threads = cores
	}

	// 负载
	output, err = config.Pool.ExecuteCommand(hostID, "cat /proc/loadavg")
	if err == nil {
		parts := strings.Fields(output)
		if len(parts) >= 3 {
			var load1, load5, load15 float64
			fmt.Sscanf(parts[0], "%f", &load1)
			fmt.Sscanf(parts[1], "%f", &load5)
			fmt.Sscanf(parts[2], "%f", &load15)
			info.LoadAvg = []float64{load1, load5, load15}
		}
	}

	// CPU 使用率
	output, err = config.Pool.ExecuteCommand(hostID, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1")
	if err == nil {
		var usage float64
		fmt.Sscanf(output, "%f", &usage)
		info.Usage = usage
	}

	return info
}

func getMemoryInfo(hostID uint) config.MemoryInfo {
	info := config.MemoryInfo{}

	output, err := config.Pool.ExecuteCommand(hostID, "cat /proc/meminfo")
	if err != nil {
		return info
	}

	var total, free, available uint64
	for _, line := range strings.Split(output, "\n") {
		if strings.HasPrefix(line, "MemTotal:") {
			fmt.Sscanf(line, "MemTotal: %d", &total)
		} else if strings.HasPrefix(line, "MemFree:") {
			fmt.Sscanf(line, "MemFree: %d", &free)
		} else if strings.HasPrefix(line, "MemAvailable:") {
			fmt.Sscanf(line, "MemAvailable: %d", &available)
		}
	}

	info.Total = total * 1024
	info.Free = free * 1024
	info.Available = available * 1024
	info.Used = info.Total - info.Available
	if info.Total > 0 {
		info.Usage = float64(info.Used) / float64(info.Total) * 100
	}

	return info
}

func getDiskInfo(hostID uint) []config.DiskInfo {
	var disks []config.DiskInfo

	// Step 1: Get system disk info using df -Th /
	// This gives us the disk that contains "/" mount point
	systemDfOutput, err := config.Pool.ExecuteCommand(hostID, "df -B1 / 2>/dev/null | tail -1")
	if err == nil && systemDfOutput != "" {
		parts := strings.Fields(systemDfOutput)
		if len(parts) >= 6 {
			var total, used uint64
			fmt.Sscanf(parts[1], "%d", &total)
			fmt.Sscanf(parts[2], "%d", &used)
			
			usagePercent := float64(0)
			if total > 0 {
				usagePercent = float64(used) / float64(total) * 100
			}

			// Get the physical disk device for this mount
			device := parts[0]
			physicalDevice := getPhysicalDiskDevice(hostID, device)
			
			disks = append(disks, config.DiskInfo{
				Device:     physicalDevice,
				MountPoint: "/",
				FileSystem: device,
				Total:      total,
				Used:       used,
				Free:       total - used,
				Usage:      usagePercent,
			})
		}
	}

	// Step 2: Get all physical disks
	lsblkOutput, err := config.Pool.ExecuteCommand(hostID, "lsblk -d -o NAME,SIZE -b 2>/dev/null | grep -v 'loop\\|NAME\\|sr\\|fd'")
	if err != nil {
		return disks
	}

	// Parse physical disks
	type physDisk struct {
		name string
		size uint64
	}
	var physicalDisks []physDisk
	for _, line := range strings.Split(lsblkOutput, "\n") {
		if line == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) < 2 {
			continue
		}
		name := parts[0]
		var size uint64
		fmt.Sscanf(parts[1], "%d", &size)
		if size >= 1024*1024*1024 { // >= 1GB
			physicalDisks = append(physicalDisks, physDisk{name: name, size: size})
		}
	}

	// Step 3: Find mount points for each physical disk (excluding system disk)
	// Get all mount points from df
	dfAllOutput, _ := config.Pool.ExecuteCommand(hostID, "df -B1 2>/dev/null")
	diskMountMap := make(map[string]string) // physical disk -> mount point

	for _, line := range strings.Split(dfAllOutput, "\n") {
		if line == "" || !strings.HasPrefix(line, "/dev/") {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) < 6 {
			continue
		}

		device := parts[0]
		mountPoint := parts[5]

		// Skip /boot and /boot/efi
		if mountPoint == "/boot" || mountPoint == "/boot/efi" ||
		   strings.HasPrefix(mountPoint, "/boot/") {
			continue
		}

		// Skip "/" (already handled as system disk)
		if mountPoint == "/" {
			continue
		}

		// Get physical disk for this device
		physicalDevice := getPhysicalDiskDevice(hostID, device)
		physicalName := strings.TrimPrefix(physicalDevice, "/dev/")
		
		// Check if this is a different physical disk than system disk
		if len(disks) > 0 && disks[0].Device == physicalDevice {
			continue // Same as system disk, skip
		}

		// Store the mount point for this physical disk
		if _, exists := diskMountMap[physicalName]; !exists {
			diskMountMap[physicalName] = mountPoint
		}
	}

	// Step 4: Get disk info for data disks
	for _, pd := range physicalDisks {
		mountPoint, hasMount := diskMountMap[pd.name]
		
		// Skip if this is the system disk
		if len(disks) > 0 && disks[0].Device == "/dev/"+pd.name {
			continue
		}

		if hasMount {
			// Get df info for this mount point
			dfOutput, err := config.Pool.ExecuteCommand(hostID, "df -B1 "+mountPoint+" 2>/dev/null | tail -1")
			if err == nil && dfOutput != "" {
				parts := strings.Fields(dfOutput)
				if len(parts) >= 6 {
					var total, used uint64
					fmt.Sscanf(parts[1], "%d", &total)
					fmt.Sscanf(parts[2], "%d", &used)
					
					usagePercent := float64(0)
					if total > 0 {
						usagePercent = float64(used) / float64(total) * 100
					}

					disks = append(disks, config.DiskInfo{
						Device:     "/dev/" + pd.name,
						MountPoint: mountPoint,
						FileSystem: parts[0],
						Total:      total,
						Used:       used,
						Free:       total - used,
						Usage:      usagePercent,
					})
				}
			}
		} else {
			// No mount point, just show the physical disk with size
			disks = append(disks, config.DiskInfo{
				Device:     "/dev/" + pd.name,
				MountPoint: "",
				FileSystem: "/dev/" + pd.name,
				Total:      pd.size,
				Used:       0,
				Free:       pd.size,
				Usage:      0,
			})
		}
	}

	return disks
}

// getPhysicalDiskDevice returns the physical disk device for a given device path
// e.g., /dev/mapper/ubuntu--vg-ubuntu--lv -> /dev/sda
func getPhysicalDiskDevice(hostID uint, device string) string {
	// Normalize device name
	deviceName := strings.TrimPrefix(device, "/dev/")
	deviceName = strings.TrimPrefix(deviceName, "mapper/")

	// Use lsblk to get the disk device
	output, err := config.Pool.ExecuteCommand(hostID, "lsblk -no PKNAME /dev/"+deviceName+" 2>/dev/null || lsblk -no PKNAME /dev/mapper/"+deviceName+" 2>/dev/null")
	if err == nil {
		parent := strings.TrimSpace(output)
		if parent != "" {
			// Check if parent is a physical disk (not another partition/LVM)
			for {
				// Check if this is a disk type
				typeOutput, err := config.Pool.ExecuteCommand(hostID, "lsblk -no TYPE /dev/"+parent+" 2>/dev/null")
				if err != nil {
					break
				}
				deviceType := strings.TrimSpace(typeOutput)
				if deviceType == "disk" {
					return "/dev/" + parent
				}
				// Get parent of this device
				parentOutput, err := config.Pool.ExecuteCommand(hostID, "lsblk -no PKNAME /dev/"+parent+" 2>/dev/null")
				if err != nil {
					break
				}
				nextParent := strings.TrimSpace(parentOutput)
				if nextParent == "" || nextParent == parent {
					break
				}
				parent = nextParent
			}
			return "/dev/" + parent
		}
	}

	// Fallback: try to find by prefix match
	lsblkOutput, _ := config.Pool.ExecuteCommand(hostID, "lsblk -d -o NAME 2>/dev/null | grep -v loop | grep -v NAME")
	for _, line := range strings.Split(lsblkOutput, "\n") {
		line = strings.TrimSpace(line)
		if line != "" && strings.HasPrefix(deviceName, line) {
			return "/dev/" + line
		}
	}

	return device
}



func getNetworkInfo(hostID uint) []config.NetInfo {
	var nets []config.NetInfo

	output, err := config.Pool.ExecuteCommand(hostID, "ip -o addr show | grep -v 'lo\\|127.0.0.1'")
	if err != nil {
		return nets
	}

	ifaceMap := make(map[string]*config.NetInfo)

	for _, line := range strings.Split(output, "\n") {
		if line == "" {
			continue
		}

		parts := strings.Fields(line)
		if len(parts) >= 4 {
			iface := parts[1]
			if _, exists := ifaceMap[iface]; !exists {
				ifaceMap[iface] = &config.NetInfo{Interface: iface}
			}

			if parts[2] == "inet" {
				ip := strings.Split(parts[3], "/")[0]
				ifaceMap[iface].IP = ip
			}
		}
	}

	// 获取 MAC 地址
	output, err = config.Pool.ExecuteCommand(hostID, "ip -o link show | grep -v lo")
	if err == nil {
		for _, line := range strings.Split(output, "\n") {
			if line == "" {
				continue
			}
			parts := strings.Fields(line)
			if len(parts) >= 20 {
				iface := strings.TrimSuffix(parts[1], ":")
				mac := parts[16]
				if net, exists := ifaceMap[iface]; exists {
					net.MAC = mac
				}
			}
		}
	}

	for _, net := range ifaceMap {
		nets = append(nets, *net)
	}

	return nets
}