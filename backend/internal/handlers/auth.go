// Package handlers - Authentication Handler (Register/Login)
// จัดการเรื่องสมัครสมาชิกและ Login พร้อม JWT Token
package handlers

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"mmrrdikub/pkg/database"
)

// ============================================
// User Model - โครงสร้างข้อมูลผู้ใช้
// ============================================
// GORM จะสร้าง Table "users" ให้อัตโนมัติ
// 🔥 FIX: ใช้ gorm tag "column" ให้ตรงกับ schema.sql
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email     string         `gorm:"uniqueIndex;size:100;not null" json:"email"` // 🔥 ADDED: email field
	Password  string         `gorm:"column:password_hash;not null" json:"-"`     // 🔥 FIX: column ชื่อ password_hash
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ============================================
// Request/Response Structs
// ============================================
// RegisterRequest - ข้อมูลที่รับมาตอนสมัครสมาชิก
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=50"`
	Email    string `json:"email" validate:"required,email"` // 🔥 ADDED: email field
	Password string `json:"password" validate:"required,min=6"`
}

// LoginRequest - ข้อมูลที่รับมาตอน Login
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse - Response ที่ส่งกลับหลัง Login สำเร็จ
type AuthResponse struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
	User      struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Email    string `json:"email"` // 🔥 ADDED
	} `json:"user"`
}

// ============================================
// JWT Claims - ข้อมูลที่เก็บใน Token
// ============================================
type JWTClaims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// ============================================
// Handler Functions
// ============================================

// Register - สมัครสมาชิกใหม่
// POST /api/register
func Register(c *fiber.Ctx) error {
	// รับข้อมูลจาก Request Body
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "ข้อมูลไม่ถูกต้อง",
			"message": err.Error(),
		})
	}

	// เช็คว่ากรอกครบมั้ย
	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "กรุณากรอก Username และ Password",
		})
	}

	// เช็คว่า Password ยาวพอมั้ย (ความปลอดภัย)
	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
		})
	}

	// เช็คว่า Username ซ้ำมั้ย
	var existingUser User
	if err := database.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Username นี้ถูกใช้แล้ว",
		})
	}

	// Hash Password ด้วย bcrypt (ความปลอดภัย - ไม่เก็บ Password ตรงๆ)
	// Cost 12 คือระดับความซับซ้อน ยิ่งสูงยิ่งปลอดภัยแต่ช้าขึ้น
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถ Hash Password ได้",
		})
	}

	// สร้าง User ใหม่
	user := User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	// บันทึกลง Database
	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "ไม่สามารถสร้างบัญชีได้",
			"message": err.Error(),
		})
	}

	// ส่ง Response สำเร็จ (ไม่ส่ง Password กลับ เพราะ json:"-")
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "สมัครสมาชิกสำเร็จ! 🎉",
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// Login - เข้าสู่ระบบ
// POST /api/login
func Login(c *fiber.Ctx) error {
	// รับข้อมูลจาก Request Body
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "ข้อมูลไม่ถูกต้อง",
			"message": err.Error(),
		})
	}

	// เช็คว่ากรอกครบมั้ย
	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "กรุณากรอก Username และ Password",
		})
	}

	// 🔥 DEBUG: Log ข้อมูลที่รับมา
	log.Printf("🔐 LOGIN ATTEMPT: username=%s", req.Username)

	// ค้นหา User จาก Database
	// 🔥 FIX: ใช้ Unscoped() เพื่อข้าม soft delete check (กรณี table ไม่มี deleted_at column)
	var user User
	if err := database.DB.Unscoped().Where("username = ?", req.Username).First(&user).Error; err != nil {
		// 🔥 DEBUG: Log error ที่เกิด
		log.Printf("❌ USER NOT FOUND: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Username หรือ Password ไม่ถูกต้อง",
		})
	}

	// 🔥 DEBUG: Log ข้อมูล user ที่เจอ
	log.Printf("✅ USER FOUND: id=%d, username=%s", user.ID, user.Username)
	log.Printf("🔑 PASSWORD HASH LENGTH: %d", len(user.Password))

	// เช็ค Password ด้วย bcrypt.CompareHashAndPassword
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		// 🔥 DEBUG: Log เมื่อ password ไม่ตรง
		log.Printf("❌ PASSWORD MISMATCH: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Username หรือ Password ไม่ถูกต้อง",
		})
	}

	log.Printf("✅ PASSWORD MATCH! Creating JWT...")

	// === สร้าง JWT Token ===
	// กำหนดเวลาหมดอายุ 24 ชั่วโมง
	expiresAt := time.Now().Add(24 * time.Hour)

	// สร้าง Claims (ข้อมูลที่อยู่ใน Token)
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "mmrrdikub",
		},
	}

	// สร้าง Token ด้วย HS256 Algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign Token ด้วย Secret Key (ดึงจาก Environment)
	jwtSecret := getJWTSecret()
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "ไม่สามารถสร้าง Token ได้",
		})
	}

	// ส่ง Response พร้อม Token กลับไป
	return c.JSON(AuthResponse{
		Token:     tokenString,
		ExpiresAt: expiresAt.Unix(),
		User: struct {
			ID       uint   `json:"id"`
			Username string `json:"username"`
			Email    string `json:"email"`
		}{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// getJWTSecret - ดึง JWT Secret จาก Environment
// ถ้าไม่มีจะใช้ค่า Default (สำหรับ Development เท่านั้น!)
func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// ⚠️ ใช้สำหรับ Dev เท่านั้น! Production ต้องตั้งค่า ENV
		secret = "mmrrdikub-super-secret-key-change-me-in-production"
	}
	return secret
}

// GetUserFromToken - ดึงข้อมูล User จาก JWT Token
// ใช้ใน Middleware และ Handler อื่นๆ
func GetUserFromToken(tokenString string) (*JWTClaims, error) {
	// Parse Token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(getJWTSecret()), nil
	})

	if err != nil {
		return nil, err
	}

	// ดึง Claims ออกมา
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// MigrateAuthModels - สร้าง Table users ใน Database
func MigrateAuthModels() error {
	return database.DB.AutoMigrate(&User{})
}
