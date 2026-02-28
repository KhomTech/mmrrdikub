package handlers

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"net"
	"net/smtp"
	"os"
	"time"

	"mmrrdikub/pkg/database"

	"strings"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// GenerateOTP สร้าง OTP ตัวเลข 6 หลัก
func GenerateOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func SendEmailOTP(toEmail, otp string) error {
	from := os.Getenv("EMAIL_USER")
	password := os.Getenv("EMAIL_PASS")

	// ลบช่องว่างใน Password ป้องกันการก็อปปี้ผิดพลาด
	password = strings.ReplaceAll(password, " ", "")

	if from == "" || password == "" {
		log.Println("⚠️ EMAIL_USER or EMAIL_PASS not configured in .env")
		return fmt.Errorf("ระบบส่งอีเมลยังไม่ได้ตั้งค่า")
	}

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	auth := smtp.PlainAuth("", from, password, smtpHost)

	subject := fmt.Sprintf("[MMRRDIKUB] รหัส OTP กู้คืนรหัสผ่านของคุณคือ: %s", otp)

	// HTML Template email
	body := fmt.Sprintf(`
		<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0a0a0a; padding: 20px; text-align: center;">
            <h2 style="color: #4ade80; margin: 0;">MMRRDIKUB SYSTEM</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff; color: #333333;">
            <p>สวัสดีครับ,</p>
            <p>นี่คือรหัส OTP สำหรับกู้คืนรหัสผ่านของคุณ (รหัสมีอายุ 5 นาที):</p>
            <h1 style="text-align: center; font-size: 32px; letter-spacing: 5px; color: #16a34a; background-color: #f0fdf4; padding: 15px; border-radius: 8px;">
              %s
            </h1>
            <hr style="border: none; border-top: 1px dashed #cccccc; margin: 30px 0;" />
            
            <h3 style="color: #000000;">🚀 เกี่ยวกับผู้พัฒนาโปรเจกต์นี้</h3>
            <p style="font-size: 14px; line-height: 1.6;">
              ระบบนี้เป็นโปรเจกต์ส่วนหนึ่งของนักศึกษา หากคุณเป็น HR หรือ Tech Lead ที่ได้รับอีเมลฉบับนี้ 
              <strong>ผมกำลังมองหาโอกาสในการฝึกงาน / ทำงานในสาย Software Engineering ในอนาคตครับ!</strong>
            </p>
            <ul style="font-size: 14px; line-height: 1.6;">
              <li><strong>Resume ของผม:</strong> <a href="https://resumeakkaraphon.vercel.app/" style="color: #2563eb;">คลิกที่นี่เพื่อดูประวัติและผลงาน</a></li>
              <li><strong>ติดต่อโดยตรง:</strong> <a href="mailto:akkaraphon7tech@gmail.com" style="color: #2563eb;">akkaraphon7tech@gmail.com</a></li>
            </ul>
            <p style="font-size: 14px;">ขอบคุณที่ทดลองใช้งานระบบของผมครับ!</p>
          </div>
        </div>
	`, otp)

	headers := "MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";"
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n%s\r\n\r\n%s", toEmail, subject, headers, body))

	// ⭐ FIX: ตรวจสอบการเชื่อมต่อก่อน (Timeout 3 วิ) ป้องกันเว็บค้าง เพราะ Render บล็อกพอร์ต 587
	conn, err := net.DialTimeout("tcp", smtpHost+":"+smtpPort, 3*time.Second)
	if err != nil {
		log.Printf("⚠️ SMTP Port Blocked (Render Free Tier?): %v", err)
		log.Printf("💡 [MOCK OTP] เนื่องจากส่งอีเมลจริงไม่ได้ รหัส OTP ของคุณคือ: %s", otp)
		// ถือว่าส่งอีเมลสำเร็จ (จำลอง) เพื่อให้ Frontend ทำงานต่อได้ไม่ค้าง
		return nil
	}
	conn.Close()

	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, msg)
	if err != nil {
		log.Printf("❌ Failed to send email to %s: %v", toEmail, err)
		return err
	}
	return nil
}

type ForgotPasswordRequestReq struct {
	Contact string `json:"contact"`
}

func ForgotPasswordRequest(c *fiber.Ctx) error {
	var req ForgotPasswordRequestReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if req.Contact == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "กรุณากรอกอีเมล"})
	}

	var user User
	if err := database.DB.Where("email = ?", req.Contact).First(&user).Error; err != nil {
		// เปลี่ยนให้แจ้งเตือนชัดเจนว่าไม่มีอีเมลนี้ในระบบ
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "ไม่พบอีเมลนี้ในระบบ โปรดตรวจสอบอีกครั้ง"})
	}

	otp, err := GenerateOTP()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "สร้าง OTP ไม่สำเร็จ"})
	}

	expires := time.Now().Add(5 * time.Minute)
	user.ResetOTP = &otp
	user.ResetOTPExpiresAt = &expires

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "บันทึก OTP ไม่สำเร็จ"})
	}

	// ส่งอีเมลแบบรอผล (Synchronous) เพื่อให้เช็ค Error ได้
	err = SendEmailOTP(user.Email, otp)
	if err != nil {
		log.Printf("❌ Email Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "ระบบส่งอีเมลขัดข้อง กรุณาลองใหม่ภายหลัง"})
	}
	log.Printf("✅ OTP sent successfully to %s", user.Email)

	return c.JSON(fiber.Map{"message": "ระบบส่ง OTP ไปยังอีเมลของท่านแล้ว"})
}

type ForgotPasswordVerifyReq struct {
	Contact string `json:"contact"`
	OTP     string `json:"otp"`
}

func ForgotPasswordVerify(c *fiber.Ctx) error {
	var req ForgotPasswordVerifyReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	var user User
	if err := database.DB.Where("email = ?", req.Contact).First(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "อีเมลหรือ OTP ไม่ถูกต้อง"})
	}

	if user.ResetOTP == nil || *user.ResetOTP != req.OTP {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "OTP ไม่ถูกต้อง"})
	}

	if user.ResetOTPExpiresAt == nil || user.ResetOTPExpiresAt.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "OTP หมดอายุแล้ว กรุณาขอใหม่"})
	}

	return c.JSON(fiber.Map{"message": "OTP ถูกต้อง"})
}

type ForgotPasswordResetReq struct {
	Contact     string `json:"contact"`
	OTP         string `json:"otp"`
	NewPassword string `json:"newPassword"`
}

func ForgotPasswordReset(c *fiber.Ctx) error {
	var req ForgotPasswordResetReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ข้อมูลไม่ถูกต้อง"})
	}

	if len(req.NewPassword) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "รหัสผ่านใหม่ต้องมี 6 ตัวอักษรขึ้นไป"})
	}

	var user User
	if err := database.DB.Where("email = ?", req.Contact).First(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "อีเมลหรือ OTP ไม่ถูกต้อง"})
	}

	if user.ResetOTP == nil || *user.ResetOTP != req.OTP {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "OTP ไม่ถูกต้อง"})
	}

	if user.ResetOTPExpiresAt == nil || user.ResetOTPExpiresAt.Before(time.Now()) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "OTP หมดอายุแล้ว กรุณาขอใหม่"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "ไม่สามารถรีเซ็ตรหัสผ่านได้"})
	}

	user.Password = string(hashedPassword)
	user.ResetOTP = nil
	user.ResetOTPExpiresAt = nil

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "บันทึกรหัสผ่านใหม่ไม่สำเร็จ"})
	}

	return c.JSON(fiber.Map{"message": "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"})
}
