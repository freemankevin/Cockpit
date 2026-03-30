package main

import (
	"fmt"
	"os"
	"path/filepath"

	"cockpit/database"
	"cockpit/middleware"
	"cockpit/models"
)

func main() {
	// 确保数据目录存在
	dataDir := "data"
	dbPath := filepath.Join(dataDir, "cockpit.db")

	// 检查数据库文件是否存在
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		fmt.Println("Database file not found:", dbPath)
		fmt.Println("Please start the server first to create the database.")
		os.Exit(1)
	}

	// 初始化数据库
	database.InitDB()

	// 获取用户名和密码参数
	username := "admin"
	password := "admin"
	
	if len(os.Args) > 1 {
		username = os.Args[1]
	}
	if len(os.Args) > 2 {
		password = os.Args[2]
	}

	// 查找用户
	user, err := database.GetUserByUsername(username)
	if err != nil {
		fmt.Printf("Error finding user: %v\n", err)
		os.Exit(1)
	}

	if user == nil {
		// 用户不存在，创建新用户
		fmt.Printf("User '%s' not found. Creating...\n", username)
		
		user = &models.User{
			Username: username,
			Role:     models.RoleAdmin,
			Email:    username + "@cockpit.local",
			IsActive: true,
		}
		
		if err := database.CreateUser(user, password); err != nil {
			fmt.Printf("Failed to create user: %v\n", err)
			os.Exit(1)
		}
		
		fmt.Printf("User '%s' created with password '%s'\n", username, password)
		return
	}

	// 用户存在，重置密码
	hashedPassword, err := middleware.HashPassword(password)
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		os.Exit(1)
	}

	// 直接更新密码和重置锁定状态
	result := database.DB.Model(&models.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
		"password_hash":  hashedPassword,
		"login_attempts": 0,
		"locked_until":   nil,
		"is_active":      true,
	})

	if result.Error != nil {
		fmt.Printf("Failed to update password: %v\n", result.Error)
		os.Exit(1)
	}

	fmt.Printf("Password for user '%s' has been reset to '%s'\n", username, password)
	fmt.Println("User account has been unlocked and activated.")
}