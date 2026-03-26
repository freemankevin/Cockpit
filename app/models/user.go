package models

import (
	"time"

	"gorm.io/gorm"
)

// UserRole 用户角色
type UserRole string

const (
	RoleAdmin    UserRole = "admin"    // 管理员：所有权限
	RoleOperator UserRole = "operator" // 操作员：部署、操作容器
	RoleViewer   UserRole = "viewer"   // 观察者：只读权限
)

// User 用户模型
type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Username     string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	PasswordHash string         `json:"-" gorm:"column:password_hash;not null"` // 不返回给前端
	Role         UserRole       `json:"role" gorm:"not null;default:'viewer'"`
	Email        string         `json:"email" gorm:"size:100"`
	Phone        string         `json:"phone" gorm:"size:20"`
	Avatar       string         `json:"avatar" gorm:"size:255"`
	LastLoginAt  *time.Time     `json:"last_login_at"`
	LastLoginIP  string         `json:"last_login_ip" gorm:"size:50"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	LoginAttempts int           `json:"-" gorm:"default:0"` // 登录失败次数
	LockedUntil  *time.Time     `json:"-"`                   // 锁定截止时间
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// IsLocked 检查用户是否被锁定
func (u *User) IsLocked() bool {
	if u.LockedUntil == nil {
		return false
	}
	return time.Now().Before(*u.LockedUntil)
}

// CanManageUsers 检查是否可以管理用户
func (u *User) CanManageUsers() bool {
	return u.Role == RoleAdmin && u.IsActive
}

// CanOperate 检查是否可以执行操作
func (u *User) CanOperate() bool {
	return (u.Role == RoleAdmin || u.Role == RoleOperator) && u.IsActive
}

// CanView 检查是否可以查看
func (u *User) CanView() bool {
	return u.IsActive
}

// ToResponse 转换为响应格式（隐藏敏感信息）
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:          u.ID,
		Username:    u.Username,
		Role:        u.Role,
		Email:       u.Email,
		Phone:       u.Phone,
		Avatar:      u.Avatar,
		LastLoginAt: u.LastLoginAt,
		LastLoginIP: u.LastLoginIP,
		IsActive:    u.IsActive,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}

// UserResponse 用户响应结构
type UserResponse struct {
	ID          uint       `json:"id"`
	Username    string     `json:"username"`
	Role        UserRole   `json:"role"`
	Email       string     `json:"email"`
	Phone       string     `json:"phone"`
	Avatar      string     `json:"avatar"`
	LastLoginAt *time.Time `json:"last_login_at"`
	LastLoginIP string     `json:"last_login_ip"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"` // 过期时间（秒）
}

// RefreshRequest 刷新Token请求
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username string   `json:"username" binding:"required,min=3,max=50"`
	Password string   `json:"password" binding:"required,min=6"`
	Role     UserRole `json:"role" binding:"required,oneof=admin operator viewer"`
	Email    string   `json:"email"`
	Phone    string   `json:"phone"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Role     *UserRole `json:"role,omitempty" binding:"omitempty,oneof=admin operator viewer"`
	Email    *string   `json:"email,omitempty"`
	Phone    *string   `json:"phone,omitempty"`
	IsActive *bool     `json:"is_active,omitempty"`
}

// UpdatePasswordRequest 更新密码请求
type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// ResetPasswordRequest 重置密码请求（管理员）
type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// TokenClaims JWT Claims
type TokenClaims struct {
	UserID   uint     `json:"user_id"`
	Username string   `json:"username"`
	Role     UserRole `json:"role"`
	TokenType string  `json:"token_type"` // access 或 refresh
}

// AuditLog 审计日志模型
type AuditLog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    *uint     `json:"user_id" gorm:"index"`
	Username  string    `json:"username" gorm:"size:50"`
	Action    string    `json:"action" gorm:"size:50;not null"` // login, logout, create_host, etc.
	Resource  string    `json:"resource" gorm:"size:50"`        // host, user, container, etc.
	ResourceID uint    `json:"resource_id"`
	Detail    string    `json:"detail" gorm:"type:text"`
	SourceIP  string    `json:"source_ip" gorm:"size:50"`
	UserAgent string    `json:"user_agent" gorm:"size:255"`
	Status    string    `json:"status" gorm:"size:20;default:'success'"` // success, failed
	ErrorMsg  string    `json:"error_msg" gorm:"size:255"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName 指定表名
func (AuditLog) TableName() string {
	return "audit_logs"
}

// AuditLogResponse 审计日志响应
type AuditLogResponse struct {
	ID         uint      `json:"id"`
	Username   string    `json:"username"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID uint      `json:"resource_id"`
	Detail     string    `json:"detail"`
	SourceIP   string    `json:"source_ip"`
	Status     string    `json:"status"`
	ErrorMsg   string    `json:"error_msg,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
