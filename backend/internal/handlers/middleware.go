// Package handlers - JWT Middleware
// ใช้ตรวจสอบ Token ก่อนเข้าถึง Protected Routes
package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// JWTMiddleware - Middleware สำหรับเช็ค JWT Token
// ใช้กับ Route ที่ต้องการ Authentication
func JWTMiddleware(c *fiber.Ctx) error {
	// ดึง Authorization Header
	authHeader := c.Get("Authorization")

	// เช็คว่ามี Header มั้ย
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "กรุณา Login ก่อน (ไม่มี Authorization Header)",
		})
	}

	// เช็ครูปแบบ "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "รูปแบบ Token ไม่ถูกต้อง (ต้องเป็น: Bearer <token>)",
		})
	}

	tokenString := parts[1]

	// ตรวจสอบและ Parse Token
	claims, err := GetUserFromToken(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Token ไม่ถูกต้องหรือหมดอายุ",
			"message": err.Error(),
		})
	}

	// เก็บข้อมูล User ไว้ใน Context เพื่อใช้ใน Handler ถัดไป
	// สามารถเรียกใช้ได้ด้วย c.Locals("userID"), c.Locals("username")
	c.Locals("userID", claims.UserID)
	c.Locals("username", claims.Username)

	// ผ่านไป Handler ถัดไป
	return c.Next()
}

// GetCurrentUserID - Helper function ดึง User ID จาก Context
// ใช้ใน Protected Routes
func GetCurrentUserID(c *fiber.Ctx) uint {
	userID, ok := c.Locals("userID").(uint)
	if !ok {
		return 0
	}
	return userID
}

// GetCurrentUsername - Helper function ดึง Username จาก Context
func GetCurrentUsername(c *fiber.Ctx) string {
	username, ok := c.Locals("username").(string)
	if !ok {
		return ""
	}
	return username
}
