package middleware

import (
	"fmt"
	"strings"
	"time"

	"cockpit/pkg/logger"
	"github.com/gin-gonic/gin"
)

// 颜色定义
const (
	colorReset  = "\033[0m"
	colorGray   = "\033[90m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
)

// LoggerConfig 日志配置
type LoggerConfig struct {
	SkipPaths    []string
	SkipPrefixes []string
}

// Logger 专业的日志中间件
func Logger(config ...LoggerConfig) gin.HandlerFunc {
	// 默认配置
	skipPaths := []string{}
	skipPrefixes := []string{}

	if len(config) > 0 {
		if config[0].SkipPaths != nil {
			skipPaths = config[0].SkipPaths
		}
		if config[0].SkipPrefixes != nil {
			skipPrefixes = config[0].SkipPrefixes
		}
	}

	return func(c *gin.Context) {
		// 开始时间
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method
		query := c.Request.URL.RawQuery

		// 处理请求
		c.Next()

		// 结束时间
		end := time.Now()
		latency := end.Sub(start)

		// 跳过指定路径
		for _, skipPath := range skipPaths {
			if path == skipPath {
				return
			}
		}

		// 跳过指定前缀
		for _, prefix := range skipPrefixes {
			if strings.HasPrefix(path, prefix) {
				return
			}
		}

		// 状态码
		status := c.Writer.Status()

		// 客户端 IP
		clientIP := c.ClientIP()

		// 响应大小
		bodySize := c.Writer.Size()

		// 构建日志消息
		var msgBuilder strings.Builder

		// 方法
		msgBuilder.WriteString(fmt.Sprintf("%-6s", method))

		// 路径
		msgBuilder.WriteString(path)

		// 查询参数
		if query != "" {
			msgBuilder.WriteString("?")
			msgBuilder.WriteString(query)
		}

		// 状态码
		msgBuilder.WriteString(fmt.Sprintf(" | %d", status))

		// 延迟
		msgBuilder.WriteString(" | ")
		msgBuilder.WriteString(formatLatency(latency))

		// 响应大小
		msgBuilder.WriteString(" | ")
		msgBuilder.WriteString(formatSize(int64(bodySize)))

		// 客户端 IP
		msgBuilder.WriteString(" | ")
		msgBuilder.WriteString(clientIP)

		// 错误信息
		if len(c.Errors) > 0 {
			msgBuilder.WriteString(" | ")
			msgBuilder.WriteString(c.Errors.String())
		}

		// 根据状态码选择日志级别
		switch {
		case status >= 500:
			logger.HTTP.Error(msgBuilder.String())
		case status >= 400:
			logger.HTTP.Warn(msgBuilder.String())
		default:
			logger.HTTP.Info(msgBuilder.String())
		}
	}
}

// formatLatency 格式化延迟
func formatLatency(latency time.Duration) string {
	switch {
	case latency < time.Millisecond:
		return fmt.Sprintf("%7dns", latency.Nanoseconds())
	case latency < time.Second:
		return fmt.Sprintf("%6.1fms", float64(latency.Microseconds())/1000)
	default:
		return fmt.Sprintf("%6.2fs", latency.Seconds())
	}
}

// formatSize 格式化大小
func formatSize(bytes int64) string {
	if bytes < 0 {
		return "-"
	}
	switch {
	case bytes < 1024:
		return fmt.Sprintf("%dB", bytes)
	case bytes < 1024*1024:
		return fmt.Sprintf("%.1fKB", float64(bytes)/1024)
	case bytes < 1024*1024*1024:
		return fmt.Sprintf("%.1fMB", float64(bytes)/(1024*1024))
	default:
		return fmt.Sprintf("%.1fGB", float64(bytes)/(1024*1024*1024))
	}
}

// PrintBanner 打印启动横幅
func PrintBanner(port int, version string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	fmt.Printf("%s%s%s [%sINFO %s] [Cockpit] Server Deployment & Management Platform v%s\n",
		colorGray, timestamp, colorReset, colorGreen, colorReset, version)
	fmt.Printf("%s%s%s [%sINFO %s] Listening on http://localhost:%d | API: /api/* | Health: /api/health\n",
		colorGray, timestamp, colorReset, colorGreen, colorReset, port)
}

// PrintStartupInfo 打印启动信息
func PrintStartupInfo(component string, status string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	var level string
	var levelColor string
	switch status {
	case "success", "ok", "initialized":
		level = "INFO "
		levelColor = colorGreen
	case "error", "failed":
		level = "ERROR"
		levelColor = colorRed
	case "warning":
		level = "WARN "
		levelColor = colorYellow
	default:
		level = "INFO "
		levelColor = colorGreen
	}
	fmt.Printf("%s%s%s [%s%s%s] %s\n", colorGray, timestamp, colorReset, levelColor, level, colorReset, component)
}


