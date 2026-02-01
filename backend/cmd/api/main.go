// Package main - Entry Point ของ Backend API
// 🔥 FIX: CORS + Logging สำหรับแก้ปัญหา Frontend เชื่อมต่อไม่ได้
package main

import (
	"log"
	"strings"
	"time"

	"mmrrdikub/internal/handlers"
	"mmrrdikub/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// ============================================
	// ส่วนที่ 1: เชื่อมต่อ Database
	// ============================================
	database.ConnectDB()
	log.Println("✅ Database Connected!")

	// ============================================
	// ส่วนที่ 2: Migrate Tables
	// ============================================
	if err := handlers.MigrateAuthModels(); err != nil {
		log.Printf("⚠️ Auth Migration: %v", err)
	}
	if err := handlers.MigrateTradeModels(); err != nil {
		log.Printf("⚠️ Trade Migration: %v", err)
	}
	log.Println("✅ Tables Ready!")

	// ============================================
	// ส่วนที่ 3: สร้าง Fiber App
	// ============================================
	app := fiber.New(fiber.Config{
		AppName:      "MMRRDiKub API v1.0",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		// Error Handler แบบสวยๆ
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			log.Printf("❌ ERROR: %s %s -> %v", c.Method(), c.Path(), err)
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	// ============================================
	// ส่วนที่ 4: Middlewares
	// ============================================

	// 🔥 FIX #1: Logger - Log ทุก Request ที่เข้ามา (สำคัญมาก!)
	// จะเห็นใน Terminal ว่า Frontend ยิงมาถึง Backend หรือเปล่า
	app.Use(logger.New(logger.Config{
		Format:     "📥 [${time}] ${status} | ${method} ${path} | ${latency} | ${ip}\n",
		TimeFormat: "15:04:05",
	}))

	// Recover - กัน Panic crash
	app.Use(recover.New())

	// 🔥 FIX #2: CORS - สำคัญที่สุด!
	// ใช้ AllowOriginsFunc เพื่อ dynamic check
	app.Use(cors.New(cors.Config{
		// อนุญาต Frontend ทั้ง localhost และ Production
		AllowOriginsFunc: func(origin string) bool {
			// Development
			if origin == "http://localhost:3000" ||
				origin == "http://127.0.0.1:3000" ||
				origin == "http://localhost:3001" {
				return true
			}
			// Production (Vercel & Custom Domain)
			if strings.HasSuffix(origin, ".vercel.app") || strings.HasSuffix(origin, ".xyz") {
				return true
			}
			// Allow requests without origin (like curl, Postman)
			if origin == "" {
				return true
			}
			return false
		},

		// Methods ที่อนุญาต
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",

		// Headers ที่อนุญาต (Authorization สำคัญสำหรับ JWT)
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",

		// 🔥 สำคัญ! ต้อง true เพื่อให้ส่ง Cookies/Credentials ได้
		AllowCredentials: true,

		// Cache Preflight Request 1 ชั่วโมง
		MaxAge: 3600,
	}))

	// ============================================
	// ส่วนที่ 5: Health Check Routes
	// ============================================
	app.Get("/", func(c *fiber.Ctx) error {
		log.Println("🏠 Health Check: Frontend reached Backend!")
		return c.JSON(fiber.Map{
			"message": "🚀 MMRRDiKub API is running!",
			"status":  "healthy",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
		})
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// ============================================
	// ส่วนที่ 6: API Routes
	// ============================================
	api := app.Group("/api")

	// Auth Routes (Public - ไม่ต้อง Login)
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)

	// Trade Routes (Protected - ต้อง Login)
	trades := api.Group("/trades", handlers.JWTMiddleware)
	trades.Post("/", handlers.CreateTrade)
	trades.Get("/", handlers.GetTrades)
	trades.Get("/:id", handlers.GetTrade)
	trades.Put("/:id", handlers.UpdateTrade)
	trades.Delete("/:id", handlers.DeleteTrade)

	// ============================================
	// ส่วนที่ 7: 404 Handler
	// ============================================
	app.Use(func(c *fiber.Ctx) error {
		log.Printf("⚠️ 404: %s %s", c.Method(), c.Path())
		return c.Status(404).JSON(fiber.Map{
			"error": "Route not found",
			"path":  c.Path(),
		})
	})

	// ============================================
	// ส่วนที่ 8: เปิด Server
	// ============================================
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("🌐 MMRRDiKub Backend API")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("📍 Listening on: http://0.0.0.0:8080")
	log.Println("📍 Frontend URL: http://localhost:3000")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("📌 API Endpoints:")
	log.Println("   POST /api/register  - สมัครสมาชิก")
	log.Println("   POST /api/login     - เข้าสู่ระบบ")
	log.Println("   POST /api/trades    - สร้างเทรด (Auth)")
	log.Println("   GET  /api/trades    - ดูประวัติ (Auth)")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// 🔥 FIX #3: Listen บน 0.0.0.0 เพื่อรับ Connection จากทุก Interface
	// ไม่ใช่แค่ localhost
	if err := app.Listen("0.0.0.0:8080"); err != nil {
		log.Fatalf("❌ Server failed: %v", err)
	}
}
