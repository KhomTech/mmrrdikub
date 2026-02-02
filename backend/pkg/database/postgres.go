// Package database - ไฟล์นี้คือ "คนกลาง" ที่คอยเชื่อมต่อโปรแกรมเรากับ PostgreSQL Database
// ทำไมต้องแยกไว้ที่นี่? เพราะถ้าวันหลังเปลี่ยน Database (เช่น MySQL) จะแก้แค่ไฟล์นี้ที่เดียว
package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB เป็นตัวแปร Global เอาไว้ให้ไฟล์อื่นเรียกใช้ (เช่น database.DB)
var DB *gorm.DB

func ConnectDB() {
	// 1. โหลดไฟล์ .env
	err := godotenv.Load()
	if err != nil {
		// ถ้าหาไม่เจอในโฟลเดอร์ปัจจุบัน ลองถอยไปหาข้างนอก (เผื่อรันจากคนละที่)
		_ = godotenv.Load("../.env")
	}

	// 2. อ่านค่า DB_URL (สำคัญมาก! ต้องอ่านตัวนี้ตัวเดียว)
	dsn := os.Getenv("DB_URL")

	// Debug: เช็คว่าอ่านค่ามาได้ไหม
	if dsn == "" {
		log.Fatal("❌ Error: หาตัวแปร DB_URL ไม่เจอ! (เช็คไฟล์ .env ด่วน)")
	} else {
		fmt.Println("✅ อ่านค่า DB_URL สำเร็จ! กำลังเชื่อมต่อ Neon...")
	}

	// 3. เชื่อมต่อ Database พร้อม Config ป้องกัน Timeout
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// ลด Log level เพื่อประหยัด Resource
		Logger: logger.Default.LogMode(logger.Warn),
		// ปิด Prepared Statement เพื่อลด Connection overhead
		PrepareStmt: false,
	})
	if err != nil {
		log.Fatal("❌ เชื่อมต่อ Database ไม่ได้: ", err)
	}

	// 4. ตั้งค่า Connection Pool เพื่อป้องกัน Timeout
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("❌ ไม่สามารถดึง SQL DB instance: ", err)
	}

	// Connection Pool Settings - สำคัญมากสำหรับ Production!
	sqlDB.SetMaxIdleConns(5)                   // จำนวน Idle connections สูงสุด
	sqlDB.SetMaxOpenConns(20)                  // จำนวน Connection สูงสุดที่เปิดได้
	sqlDB.SetConnMaxLifetime(30 * time.Minute) // อายุสูงสุดของ Connection
	sqlDB.SetConnMaxIdleTime(10 * time.Minute) // เวลา Idle สูงสุดก่อนปิด

	// 5. Test Connection เพื่อให้แน่ใจว่าใช้งานได้
	if err := sqlDB.Ping(); err != nil {
		log.Fatal("❌ Ping Database ไม่ได้: ", err)
	}

	// 6. บันทึก Connection ลงตัวแปร Global
	DB = db
	fmt.Println("🚀 Database Connected Successfully! (Pool: 5-20 connections)")
}
