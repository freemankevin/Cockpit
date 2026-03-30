package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"cockpit/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// JWT 配置常量
const (
	AccessTokenExpiry  = 24 * time.Hour   // Access Token 有效期 24 小时
	RefreshTokenExpiry = 7 * 24 * time.Hour // Refresh Token 有效期 7 天
	MaxLoginAttempts   = 5                  // 最大登录失败次数
	LockDuration       = 10 * time.Minute   // 锁定时间
)

var jwtSecret []byte

// InitJWT 初始化 JWT 密钥
func InitJWT(secret string) {
	if secret == "" {
		// 使用默认密钥（生产环境应该通过环境变量设置）
		jwtSecret = []byte("cockpit-secret-key-change-in-production")
	} else {
		jwtSecret = []byte(secret)
	}
}

// GenerateTokenPair 生成 Access Token 和 Refresh Token
func GenerateTokenPair(user *models.User) (*models.LoginResponse, error) {
	// Access Token
	accessClaims := jwt.MapClaims{
		"user_id":    user.ID,
		"username":   user.Username,
		"role":       user.Role,
		"token_type": "access",
		"exp":        time.Now().Add(AccessTokenExpiry).Unix(),
		"iat":        time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	// Refresh Token
	refreshClaims := jwt.MapClaims{
		"user_id":    user.ID,
		"token_type": "refresh",
		"exp":        time.Now().Add(RefreshTokenExpiry).Unix(),
		"iat":        time.Now().Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &models.LoginResponse{
		User:         user.ToResponse(),
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		ExpiresIn:    int(AccessTokenExpiry.Seconds()),
	}, nil
}

// ParseToken 解析 JWT Token
func ParseToken(tokenString string) (*models.TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// 验证签名算法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &models.TokenClaims{
			UserID:    uint(claims["user_id"].(float64)),
			Username:  claims["username"].(string),
			Role:      models.UserRole(claims["role"].(string)),
			TokenType: claims["token_type"].(string),
		}, nil
	}

	return nil, errors.New("invalid token claims")
}

// ParseRefreshToken 解析 Refresh Token
func ParseRefreshToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// 验证 token 类型
		if tokenType, ok := claims["token_type"].(string); !ok || tokenType != "refresh" {
			return 0, errors.New("invalid token type")
		}
		return uint(claims["user_id"].(float64)), nil
	}

	return 0, errors.New("invalid token claims")
}

// HashPassword 使用 bcrypt 哈希密码
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword 验证密码
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// JWTAuthMiddleware JWT authentication middleware
func JWTAuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization from Header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Authentication token not provided",
				"data":    nil,
			})
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Invalid authentication format, please use Bearer token",
				"data":    nil,
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse token
		claims, err := ParseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Token is invalid or expired",
				"data":    nil,
			})
			c.Abort()
			return
		}

		// Verify token type
		if claims.TokenType != "access" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Invalid token type",
				"data":    nil,
			})
			c.Abort()
			return
		}

		// Check if user exists and is active
		var user models.User
		if err := db.First(&user, claims.UserID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{
					"code":    401,
					"message": "User not found",
					"data":    nil,
				})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{
					"code":    500,
					"message": "Database error",
					"data":    nil,
				})
			}
			c.Abort()
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "User account is disabled",
				"data":    nil,
			})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Set("user", &user)

		c.Next()
	}
}

// GetCurrentUser 从上下文获取当前用户
func GetCurrentUser(c *gin.Context) *models.User {
	user, exists := c.Get("user")
	if !exists {
		return nil
	}
	return user.(*models.User)
}

// GetCurrentUserID 从上下文获取当前用户ID
func GetCurrentUserID(c *gin.Context) uint {
	userID, exists := c.Get("userID")
	if !exists {
		return 0
	}
	return userID.(uint)
}

// GetCurrentRole 从上下文获取当前用户角色
func GetCurrentRole(c *gin.Context) models.UserRole {
	role, exists := c.Get("role")
	if !exists {
		return models.RoleViewer
	}
	return role.(models.UserRole)
}

// RequireRole Role permission check middleware
func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		currentRole := GetCurrentRole(c)
		
		for _, role := range roles {
			if currentRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"code":    403,
			"message": "Insufficient permissions",
			"data":    nil,
		})
		c.Abort()
	}
}

// RequireAdmin 管理员权限检查
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// RequireOperator 操作员及以上权限检查
func RequireOperator() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleOperator)
}
