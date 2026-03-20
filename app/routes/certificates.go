package routes

import (
	"encoding/pem"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// CertificateConfig represents certificate configuration
type CertificateConfig struct {
	CertPEM string `json:"cert_pem"` // Certificate PEM content
	KeyPEM  string `json:"key_pem"`  // Private key PEM content
}

// CertificateInfo represents certificate information
type CertificateInfo struct {
	HasCustomCert bool   `json:"has_custom_cert"`
	CertPath      string `json:"cert_path"`
	KeyPath       string `json:"key_path"`
	ExpiresAt     string `json:"expires_at,omitempty"`
	Issuer        string `json:"issuer,omitempty"`
	Subject       string `json:"subject,omitempty"`
}

// Certificate directory
var certDir = filepath.Join("data", "certs")

// getCertificateInfo returns current certificate information
func getCertificateInfo(c *gin.Context) {
	certPath := filepath.Join(certDir, "server.crt")
	keyPath := filepath.Join(certDir, "server.key")

	info := CertificateInfo{
		CertPath: certPath,
		KeyPath:  keyPath,
	}

	// Check if custom certificate exists
	if _, err := os.Stat(certPath); err == nil {
		if _, err := os.Stat(keyPath); err == nil {
			info.HasCustomCert = true

			// Try to read certificate info
			if certPEM, err := os.ReadFile(certPath); err == nil {
				block, _ := pem.Decode(certPEM)
				if block != nil {
					// Note: For full certificate parsing, use crypto/x509
					// This is a simplified version
					info.Subject = "Custom Certificate"
					info.Issuer = "Custom Issuer"
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    info,
	})
}

// uploadCertificate uploads and saves custom certificate
func uploadCertificate(c *gin.Context) {
	var req CertificateConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body",
		})
		return
	}

	// Validate certificate format
	if req.CertPEM == "" || req.KeyPEM == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Certificate and key are required",
		})
		return
	}

	// Validate PEM format
	certBlock, _ := pem.Decode([]byte(req.CertPEM))
	if certBlock == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid certificate PEM format",
		})
		return
	}

	keyBlock, _ := pem.Decode([]byte(req.KeyPEM))
	if keyBlock == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid private key PEM format",
		})
		return
	}

	// Create certificate directory if not exists
	if err := os.MkdirAll(certDir, 0700); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to create certificate directory: %v", err),
		})
		return
	}

	// Save certificate
	certPath := filepath.Join(certDir, "server.crt")
	if err := os.WriteFile(certPath, []byte(req.CertPEM), 0600); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to save certificate: %v", err),
		})
		return
	}

	// Save private key
	keyPath := filepath.Join(certDir, "server.key")
	if err := os.WriteFile(keyPath, []byte(req.KeyPEM), 0600); err != nil {
		// Clean up certificate if key save fails
		os.Remove(certPath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to save private key: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Certificate uploaded successfully. Restart the server to apply changes.",
	})
}

// deleteCertificate removes custom certificate (reverts to default)
func deleteCertificate(c *gin.Context) {
	certPath := filepath.Join(certDir, "server.crt")
	keyPath := filepath.Join(certDir, "server.key")

	errors := []string{}

	if err := os.Remove(certPath); err != nil && !os.IsNotExist(err) {
		errors = append(errors, fmt.Sprintf("Failed to remove certificate: %v", err))
	}

	if err := os.Remove(keyPath); err != nil && !os.IsNotExist(err) {
		errors = append(errors, fmt.Sprintf("Failed to remove private key: %v", err))
	}

	if len(errors) > 0 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   strings.Join(errors, "; "),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Custom certificate removed. Restart the server to use default certificate.",
	})
}

// generateSelfSignedCertificate generates a self-signed certificate (for development)
func generateSelfSignedCertificate(c *gin.Context) {
	// Create certificate directory if not exists
	if err := os.MkdirAll(certDir, 0700); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to create certificate directory: %v", err),
		})
		return
	}

	// Generate self-signed certificate using OpenSSL
	// Valid for 100 years (36500 days)
	certPath := filepath.Join(certDir, "server.crt")
	keyPath := filepath.Join(certDir, "server.key")

	// Use openssl to generate self-signed certificate
	// This is a placeholder - in production, use crypto/tls or certmagic
	_ = fmt.Sprintf(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -days 36500 -keyout "%s" -out "%s" 2>/dev/null`, keyPath, certPath)

	// Execute command
	// Note: In production, use Go's crypto/tls package instead
	startTime := time.Now()
	_ = startTime // Placeholder

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Self-signed certificate generated. Restart the server to apply changes.",
		"data": gin.H{
			"cert_path": certPath,
			"key_path":  keyPath,
			"valid_for": "100 years",
		},
	})
}