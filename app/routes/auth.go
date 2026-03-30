package routes

import (
	"net/http"
	"time"

	"cockpit/database"
	"cockpit/middleware"
	"cockpit/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthRoutes 认证路由
func AuthRoutes(r *gin.RouterGroup, db *gorm.DB) {
	auth := r.Group("/auth")

	// 公开路由（无需认证）
	auth.POST("/login", loginHandler(db))
	auth.POST("/refresh", refreshTokenHandler(db))

	// 需要认证的路由
	auth.Use(middleware.JWTAuthMiddleware(db))
	auth.POST("/logout", logoutHandler)
	auth.GET("/me", getCurrentUserHandler)
	auth.PUT("/password", updatePasswordHandler(db))
}

// loginHandler 登录处理
func loginHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid request parameters",
				"data":    nil,
			})
			return
		}

		// 查找用户
		user, err := database.GetUserByUsername(req.Username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Internal server error",
				"data":    nil,
			})
			return
		}

		if user == nil {
			// 记录审计日志
			recordAuditLog(db, nil, req.Username, "login", "user", 0, "登录失败：用户不存在", c, "failed")
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Invalid username or password",
				"data":    nil,
			})
			return
		}

		// 检查账号是否被锁定
		if user.IsLocked() {
			recordAuditLog(db, &user.ID, user.Username, "login", "user", user.ID, "登录失败：账号已锁定", c, "failed")
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "Account is locked, please try again later",
				"data":    nil,
			})
			return
		}

		// 检查账号是否激活
		if !user.IsActive {
			recordAuditLog(db, &user.ID, user.Username, "login", "user", user.ID, "登录失败：账号已禁用", c, "failed")
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "Account is disabled",
				"data":    nil,
			})
			return
		}

		// 验证密码
		if !middleware.CheckPassword(req.Password, user.PasswordHash) {
			// 记录失败尝试
			database.RecordLoginAttempt(user.ID, false)
			recordAuditLog(db, &user.ID, user.Username, "login", "user", user.ID, "登录失败：密码错误", c, "failed")
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Invalid username or password",
				"data":    nil,
			})
			return
		}

		// 登录成功，生成 Token
		tokenPair, err := middleware.GenerateTokenPair(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to generate token",
				"data":    nil,
			})
			return
		}

		// 更新最后登录信息
		clientIP := c.ClientIP()
		database.UpdateLastLogin(user.ID, clientIP)

		// 记录审计日志
		recordAuditLog(db, &user.ID, user.Username, "login", "user", user.ID, "登录成功", c, "success")

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "Login successful",
			"data":    tokenPair,
		})
	}
}

// refreshTokenHandler 刷新 Token
func refreshTokenHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.RefreshRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid request parameters",
				"data":    nil,
			})
			return
		}

		// 解析 refresh token
		userID, err := middleware.ParseRefreshToken(req.RefreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Invalid or expired refresh token",
				"data":    nil,
			})
			return
		}

		// 查找用户
		user, err := database.GetUserByID(userID)
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "User not found",
				"data":    nil,
			})
			return
		}

		// 检查账号状态
		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "Account is disabled",
				"data":    nil,
			})
			return
		}

		// 生成新的 Token
		tokenPair, err := middleware.GenerateTokenPair(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to generate token",
				"data":    nil,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "Token refreshed successfully",
			"data":    tokenPair,
		})
	}
}

// logoutHandler 登出处理
func logoutHandler(c *gin.Context) {
	// JWT 是无状态的，登出只需客户端删除 Token
	// 如果需要服务端失效，可以将 Token 加入黑名单（使用 Redis）

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "Logout successful",
		"data":    nil,
	})
}

// getCurrentUserHandler 获取当前用户信息
func getCurrentUserHandler(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    401,
			"message": "Unauthorized",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    user.ToResponse(),
	})
}

// updatePasswordHandler 更新密码
func updatePasswordHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.UpdatePasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid request parameters",
				"data":    nil,
			})
			return
		}

		user := middleware.GetCurrentUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Unauthorized",
				"data":    nil,
			})
			return
		}

		// 验证旧密码
		if !middleware.CheckPassword(req.OldPassword, user.PasswordHash) {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Current password is incorrect",
				"data":    nil,
			})
			return
		}

		// 更新密码
		if err := database.UpdateUserPassword(user.ID, req.NewPassword); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to update password",
				"data":    nil,
			})
			return
		}

		// 记录审计日志
		recordAuditLog(db, &user.ID, user.Username, "update_password", "user", user.ID, "修改密码成功", c, "success")

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "Password updated successfully",
			"data":    nil,
		})
	}
}

// recordAuditLog 记录审计日志
func recordAuditLog(db *gorm.DB, userID *uint, username, action, resource string, resourceID uint, detail string, c *gin.Context, status string) {
	log := &models.AuditLog{
		UserID:     userID,
		Username:   username,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Detail:     detail,
		SourceIP:   c.ClientIP(),
		UserAgent:  c.GetHeader("User-Agent"),
		Status:     status,
		CreatedAt:  time.Now(),
	}

	// 异步写入审计日志
	go func() {
		database.CreateAuditLog(log)
	}()
}
