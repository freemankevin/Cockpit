package main

import (
	"fmt"
	"os"
	"path/filepath"

	"cockpit/database"
)

func main() {
	// 确保数据目录存在
	dataDir := "data"
	dbPath := filepath.Join(dataDir, "cockpit.db")

	// 检查数据库文件是否存在
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		fmt.Println("Database file not found:", dbPath)
		os.Exit(1)
	}

	// 初始化数据库
	database.InitDB()

	// 获取用户名参数
	username := "admin"
	if len(os.Args) > 1 {
		username = os.Args[1]
	}

	// 解锁用户
	if err := database.UnlockUserByUsername(username); err != nil {
		fmt.Printf("Failed to unlock user '%s': %v\n", username, err)
		os.Exit(1)
	}

	fmt.Printf("User '%s' unlocked successfully!\n", username)
}