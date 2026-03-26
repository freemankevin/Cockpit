package routes

import (
	"net/http"
	"strconv"
	"time"

	"cockpit/database"
	"cockpit/middleware"
	"cockpit/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// UserRoutes 用户管理路由
func UserRoutes(r *gin.RouterGroup, db *gorm.DB) {
	users := r.Group("/users")
	users.Use(middleware.JWTAuthMiddleware(db))

	// 用户列表 - Admin only
	users.GET("", middleware.RequireAdmin(), listUsersHandler(db))

	// 创建用户 - Admin only
	users.POST("", middleware.RequireAdmin(), createUserHandler(db))

	// 获取单个用户
	users.GET("/:id", getUserHandler(db))

	// 更新用户 - Admin only
	users.PUT("/:id", middleware.RequireAdmin(), updateUserHandler(db))

	// 删除用户 - Admin only
	users.DELETE("/:id", middleware.RequireAdmin(), deleteUserHandler(db))

	// 重置密码 - Admin only
	users.POST("/:id/reset-password", middleware.RequireAdmin(), resetPasswordHandler(db))

	// 审计日志 - Admin only
	users.GET("/audit-logs", middleware.RequireAdmin(), listAuditLogsHandler(db))
}

// listUsersHandler 获取用户列表
func listUsersHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取分页参数
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

		if page < 1 {
			page = 1
		}
		if pageSize < 1 || pageSize > 100 {
			pageSize = 20
		}

		// 查询用户列表
		users, total, err := database.GetAllUsers(page, pageSize)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取用户列表失败",
				"data":    nil,
			})
			return
		}

		// 转换为响应格式
		userResponses := make([]models.UserResponse, len(users))
		for i, user := range users {
			userResponses[i] = user.ToResponse()
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"list":      userResponses,
				"total":     total,
				"page":      page,
				"page_size": pageSize,
			},
		})
	}
}

// createUserHandler 创建用户
func createUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.CreateUserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "请求参数错误: " + err.Error(),
				"data":    nil,
			})
			return
		}

		// 检查用户名是否已存在
		exists, err := database.CheckUserExists(req.Username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "检查用户名失败",
				"data":    nil,
			})
			return
		}
		if exists {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "用户名已存在",
				"data":    nil,
			})
			return
		}

		// 创建用户
		user := &models.User{
			Username: req.Username,
			Role:     req.Role,
			Email:    req.Email,
			Phone:    req.Phone,
			IsActive: true,
		}

		if err := database.CreateUser(user, req.Password); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "创建用户失败",
				"data":    nil,
			})
			return
		}

		// 记录审计日志
		currentUser := middleware.GetCurrentUser(c)
		recordAuditLog(db, &currentUser.ID, currentUser.Username, "create_user", "user", user.ID,
			"创建用户: "+user.Username, c, "success")

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "用户创建成功",
			"data":    user.ToResponse(),
		})
	}
}

// getUserHandler 获取单个用户
func getUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "无效的用户ID",
				"data":    nil,
			})
			return
		}

		user, err := database.GetUserByID(uint(id))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取用户信息失败",
				"data":    nil,
			})
			return
		}

		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "用户不存在",
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
}

// updateUserHandler 更新用户
func updateUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "无效的用户ID",
				"data":    nil,
			})
			return
		}

		var req models.UpdateUserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "请求参数错误",
				"data":    nil,
			})
			return
		}

		// 获取用户
		user, err := database.GetUserByID(uint(id))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取用户信息失败",
				"data":    nil,
			})
			return
		}

		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "用户不存在",
				"data":    nil,
			})
			return
		}

		// 更新字段
		if req.Role != nil {
			user.Role = *req.Role
		}
		if req.Email != nil {
			user.Email = *req.Email
		}
		if req.Phone != nil {
			user.Phone = *req.Phone
		}
		if req.IsActive != nil {
			user.IsActive = *req.IsActive
		}

		if err := database.UpdateUser(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "更新用户失败",
				"data":    nil,
			})
			return
		}

		// 记录审计日志
		currentUser := middleware.GetCurrentUser(c)
		recordAuditLog(db, &currentUser.ID, currentUser.Username, "update_user", "user", user.ID,
			"更新用户: "+user.Username, c, "success")

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "用户更新成功",
			"data":    user.ToResponse(),
		})
	}
}

// deleteUserHandler 删除用户
func deleteUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "无效的用户ID",
				"data":    nil,
			})
			return
		}

		// 不能删除自己
		currentUserID := middleware.GetCurrentUserID(c)
		if uint(id) == currentUserID {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "不能删除自己的账号",
				"data":    nil,
			})
			return
		}

		// 获取用户信息用于审计日志
		user, err := database.GetUserByID(uint(id))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取用户信息失败",
				"data":    nil,
			})
			return
		}

		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "用户不存在",
				"data":    nil,
			})
			return
		}

		// 删除用户
		if err := database.DeleteUser(uint(id)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "删除用户失败",
				"data":    nil,
			})
			return
		}

		// 记录审计日志
		currentUser := middleware.GetCurrentUser(c)
		recordAuditLog(db, &currentUser.ID, currentUser.Username, "delete_user", "user", uint(id),
			"删除用户: "+user.Username, c, "success")

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "用户删除成功",
			"data":    nil,
		})
	}
}

// resetPasswordHandler 重置密码（管理员）
func resetPasswordHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "无效的用户ID",
				"data":    nil,
			})
			return
		}

		var req models.ResetPasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "请求参数错误",
				"data":    nil,
			})
			return
		}

		// 检查用户是否存在
		user, err := database.GetUserByID(uint(id))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取用户信息失败",
				"data":    nil,
			})
			return
		}

		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "用户不存在",
				"data":    nil,
			})
			return
		}

		// 重置密码
		if err := database.UpdateUserPassword(uint(id), req.NewPassword); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "重置密码失败",
				"data":    nil,
			})
			return
		}

		// 记录审计日志
		currentUser := middleware.GetCurrentUser(c)
		recordAuditLog(db, &currentUser.ID, currentUser.Username, "reset_password", "user", uint(id),
			"重置用户密码: "+user.Username, c, "success")

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "密码重置成功",
			"data":    nil,
		})
	}
}

// listAuditLogsHandler 获取审计日志列表
func listAuditLogsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取分页参数
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

		if page < 1 {
			page = 1
		}
		if pageSize < 1 || pageSize > 100 {
			pageSize = 20
		}

		// 获取筛选参数
		var userID *uint
		if uid := c.Query("user_id"); uid != "" {
			id, err := strconv.ParseUint(uid, 10, 32)
			if err == nil {
				uidUint := uint(id)
				userID = &uidUint
			}
		}

		action := c.Query("action")
		resource := c.Query("resource")

		var startTime, endTime *time.Time
		if st := c.Query("start_time"); st != "" {
			t, err := time.Parse(time.RFC3339, st)
			if err == nil {
				startTime = &t
			}
		}
		if et := c.Query("end_time"); et != "" {
			t, err := time.Parse(time.RFC3339, et)
			if err == nil {
				endTime = &t
			}
		}

		// 查询审计日志
		logs, total, err := database.GetAuditLogs(page, pageSize, userID, action, resource, startTime, endTime)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取审计日志失败",
				"data":    nil,
			})
			return
		}

		// 转换为响应格式
		logResponses := make([]models.AuditLogResponse, len(logs))
		for i, log := range logs {
			logResponses[i] = models.AuditLogResponse{
				ID:         log.ID,
				Username:   log.Username,
				Action:     log.Action,
				Resource:   log.Resource,
				ResourceID: log.ResourceID,
				Detail:     log.Detail,
				SourceIP:   log.SourceIP,
				Status:     log.Status,
				ErrorMsg:   log.ErrorMsg,
				CreatedAt:  log.CreatedAt,
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "success",
			"data": gin.H{
				"list":      logResponses,
				"total":     total,
				"page":      page,
				"page_size": pageSize,
			},
		})
	}
}
