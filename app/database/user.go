package database

import (
	"errors"
	"fmt"
	"time"

	"cockpit/middleware"
	"cockpit/models"
	"gorm.io/gorm"
)

// 颜色定义
const (
	colorReset  = "\033[0m"
	colorGray   = "\033[90m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
)

// ==================== 用户相关操作 ====================

// CreateUser 创建用户（密码会自动哈希）
func CreateUser(user *models.User, password string) error {
	// 哈希密码
	hashedPassword, err := middleware.HashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	user.PasswordHash = hashedPassword

	return DB.Create(user).Error
}

// GetUserByID 根据ID获取用户
func GetUserByID(id uint) (*models.User, error) {
	var user models.User
	result := DB.First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &user, nil
}

// GetUserByUsername 根据用户名获取用户
func GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	result := DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &user, nil
}

// GetAllUsers 获取所有用户（支持分页）
func GetAllUsers(page, pageSize int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	// 计算总数
	if err := DB.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	result := DB.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&users)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return users, total, nil
}

// UpdateUser 更新用户信息
func UpdateUser(user *models.User) error {
	return DB.Save(user).Error
}

// UpdateUserPassword 更新用户密码
func UpdateUserPassword(userID uint, newPassword string) error {
	hashedPassword, err := middleware.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	return DB.Model(&models.User{}).Where("id = ?", userID).Update("password_hash", hashedPassword).Error
}

// DeleteUser 删除用户（软删除）
func DeleteUser(id uint) error {
	return DB.Delete(&models.User{}, id).Error
}

// HardDeleteUser 硬删除用户
func HardDeleteUser(id uint) error {
	return DB.Unscoped().Delete(&models.User{}, id).Error
}

// RecordLoginAttempt 记录登录尝试
func RecordLoginAttempt(userID uint, success bool) error {
	user, err := GetUserByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	if success {
		// 登录成功，重置失败次数
		user.LoginAttempts = 0
		user.LockedUntil = nil
	} else {
		// 登录失败，增加计数
		user.LoginAttempts++
		if user.LoginAttempts >= middleware.MaxLoginAttempts {
			// 超过最大尝试次数，锁定账号
			lockUntil := time.Now().Add(middleware.LockDuration)
			user.LockedUntil = &lockUntil
		}
	}

	return DB.Save(user).Error
}

// UpdateLastLogin 更新最后登录信息
func UpdateLastLogin(userID uint, ip string) error {
	now := time.Now()
	return DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"last_login_at":  &now,
		"last_login_ip":  ip,
		"login_attempts": 0,
		"locked_until":   nil,
	}).Error
}

// UnlockUser 解锁用户账号
func UnlockUser(userID uint) error {
	return DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"login_attempts": 0,
		"locked_until":   nil,
	}).Error
}

// UnlockUserByUsername 通过用户名解锁用户账号
func UnlockUserByUsername(username string) error {
	return DB.Model(&models.User{}).Where("username = ?", username).Updates(map[string]interface{}{
		"login_attempts": 0,
		"locked_until":   nil,
	}).Error
}

// CheckUserExists 检查用户名是否已存在
func CheckUserExists(username string) (bool, error) {
	var count int64
	err := DB.Model(&models.User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

// Default admin credentials
const (
	DefaultAdminUsername = "admin"
	DefaultAdminPassword = "admin"
)

// InitDefaultAdmin 初始化默认管理员账号
func InitDefaultAdmin() error {
	// 检查是否已有用户
	var count int64
	if err := DB.Model(&models.User{}).Count(&count).Error; err != nil {
		return err
	}

	// 已有用户则不创建，只打印启动信息
	if count > 0 {
		printStartupInfo(false)
		return nil
	}

	// 创建默认管理员
	admin := &models.User{
		Username: DefaultAdminUsername,
		Role:     models.RoleAdmin,
		Email:    "admin@cockpit.local",
		IsActive: true,
	}

	if err := CreateUser(admin, DefaultAdminPassword); err != nil {
		return fmt.Errorf("failed to create default admin: %w", err)
	}

	// 打印首次启动信息（包含默认密码）
	printStartupInfo(true)

	return nil
}

// printStartupInfo 打印启动信息
func printStartupInfo(isFirstRun bool) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	if isFirstRun {
		fmt.Printf("%s%s%s [%sINFO %s] Default admin account created\n", colorGray, timestamp, colorReset, colorGreen, colorReset)
		fmt.Printf("%s%s%s [%sINFO %s] Username: admin | Password: admin\n", colorGray, timestamp, colorReset, colorGreen, colorReset)
		fmt.Printf("%s%s%s [%sWARN %s] Please change password after first login!\n", colorGray, timestamp, colorReset, colorYellow, colorReset)
	} else {
		fmt.Printf("%s%s%s [%sINFO %s] Cockpit Ready - Login with your credentials\n", colorGray, timestamp, colorReset, colorGreen, colorReset)
	}
}

// ==================== 审计日志相关操作 ====================

// CreateAuditLog 创建审计日志
func CreateAuditLog(log *models.AuditLog) error {
	return DB.Create(log).Error
}

// GetAuditLogs 获取审计日志列表（支持分页和筛选）
func GetAuditLogs(page, pageSize int, userID *uint, action, resource string, startTime, endTime *time.Time) ([]models.AuditLog, int64, error) {
	var logs []models.AuditLog
	var total int64

	query := DB.Model(&models.AuditLog{})

	// 应用筛选条件
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if resource != "" {
		query = query.Where("resource = ?", resource)
	}
	if startTime != nil {
		query = query.Where("created_at >= ?", *startTime)
	}
	if endTime != nil {
		query = query.Where("created_at <= ?", *endTime)
	}

	// 计算总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	result := query.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&logs)
	if result.Error != nil {
		return nil, 0, result.Error
	}

	return logs, total, nil
}

// GetAuditLogByID 根据ID获取审计日志
func GetAuditLogByID(id uint) (*models.AuditLog, error) {
	var log models.AuditLog
	result := DB.First(&log, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &log, nil
}

// ClearOldAuditLogs 清理旧审计日志
func ClearOldAuditLogs(before time.Time) error {
	return DB.Where("created_at < ?", before).Delete(&models.AuditLog{}).Error
}
