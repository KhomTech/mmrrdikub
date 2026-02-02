// Package handlers - Trade Management Handler (CRUD)
// จัดการ Create, Read, Update, Delete ของบันทึกการเทรด
// 🔥 UPGRADED: Professional-grade Trading Journal with advanced fields
package handlers

import (
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"mmrrdikub/pkg/database"
)

// ============================================
// Trade Model - โครงสร้างข้อมูลการเทรด (UPGRADED)
// ============================================
// ฟีลด์ทั้งหมดที่ต้องมีสำหรับ Professional Trading Journal
type Trade struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	UserID uint `gorm:"index;not null" json:"user_id"`

	// === ข้อมูลพื้นฐาน ===
	Pair string `gorm:"size:50;not null" json:"pair"` // เช่น BTC/USDT (increased size)
	Side string `gorm:"size:10;not null" json:"side"` // LONG หรือ SHORT

	// === ราคา (Fixed overflow: precision 24, scale 8 to match DB schema) ===
	EntryPrice float64 `gorm:"type:decimal(24,8);not null" json:"entry_price"`
	ExitPrice  float64 `gorm:"type:decimal(24,8)" json:"exit_price"`
	StopLoss   float64 `gorm:"type:decimal(24,8)" json:"stop_loss"`
	TakeProfit float64 `gorm:"type:decimal(24,8)" json:"take_profit"`

	// === ขนาดไม้ (Fixed overflow: precision 18, scale 4) ===
	PositionSize float64 `gorm:"type:decimal(18,4);not null" json:"position_size"` // มูลค่า USD
	Quantity     float64 `gorm:"type:decimal(24,12)" json:"quantity"`              // จำนวนเหรียญ (ตัวเลขเล็กมากๆ)
	Leverage     int     `gorm:"default:1" json:"leverage"`

	// === Advanced Risk Management (Fixed overflow) ===
	RiskPercent     float64 `gorm:"type:decimal(10,4)" json:"risk_percent"`      // เช่น 1.5 (หมายถึง 1.5%)
	MaxWin          float64 `gorm:"type:decimal(18,4)" json:"max_win"`           // กำไรสูงสุดถ้าชนะ (USD)
	MaxLoss         float64 `gorm:"type:decimal(18,4)" json:"max_loss"`          // ขาดทุนถ้าโดน SL (USD)
	RiskRewardRatio float64 `gorm:"type:decimal(10,4)" json:"risk_reward_ratio"` // เช่น 2.5 (R:R = 1:2.5)

	// === Trading Fees ===
	Fee float64 `gorm:"type:decimal(18,4)" json:"fee"` // ค่าธรรมเนียม (USD)

	// === Analysis & Reason ===
	EntryReason string `gorm:"type:text" json:"entry_reason"` // เหตุผลเข้าเทรด
	SetupScore  int    `gorm:"default:0" json:"setup_score"`  // คะแนน 1-5 ดาว

	// === ผลลัพธ์ (Fixed overflow) ===
	PnL        float64 `gorm:"column:pnl;type:decimal(18,4)" json:"pnl"`                 // กำไร/ขาดทุนจริง (USD)
	PnLPercent float64 `gorm:"column:pnl_percent;type:decimal(10,4)" json:"pnl_percent"` // กำไร/ขาดทุน (%)
	Status     string  `gorm:"size:20;default:'OPEN'" json:"status"`                     // OPEN, WIN, LOSS, BREAK_EVEN

	// === ข้อมูลเพิ่มเติม ===
	Notes string `gorm:"type:text" json:"notes"` // บันทึกเพิ่มเติม
	Tags  string `gorm:"size:200" json:"tags"`   // เช่น "breakout,trend"

	// === เวลา ===
	EntryTime *time.Time `json:"entry_time"` // เวลาเข้าเทรด
	ExitTime  *time.Time `json:"exit_time"`  // เวลาออกเทรด

	// === System Timestamps ===
	OpenedAt  *time.Time     `json:"opened_at"` // เวลาเปิดออเดอร์
	ClosedAt  *time.Time     `json:"closed_at"` // เวลาปิดออเดอร์
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ============================================
// Request Structs
// ============================================

// CreateTradeRequest - ข้อมูลสำหรับสร้างเทรดใหม่ (UPGRADED)
type CreateTradeRequest struct {
	// Basic Info
	Pair string `json:"pair" validate:"required"`
	Side string `json:"side" validate:"required,oneof=LONG SHORT"`

	// Prices
	EntryPrice float64 `json:"entry_price" validate:"required,gt=0"`
	StopLoss   float64 `json:"stop_loss"`
	TakeProfit float64 `json:"take_profit"`

	// Position Sizing
	PositionSize float64 `json:"position_size" validate:"required,gt=0"`
	Quantity     float64 `json:"quantity"`
	Leverage     int     `json:"leverage"`

	// 🔥 NEW: Risk Management
	RiskPercent     float64 `json:"risk_percent"`
	MaxWin          float64 `json:"max_win"`
	MaxLoss         float64 `json:"max_loss"`
	RiskRewardRatio float64 `json:"risk_reward_ratio"`
	Fee             float64 `json:"fee"`

	// 🔥 NEW: Analysis
	EntryReason string `json:"entry_reason"`
	SetupScore  int    `json:"setup_score"`

	// Notes
	Notes string `json:"notes"`
	Tags  string `json:"tags"`

	// Time (optional)
	EntryTime *time.Time `json:"entry_time"`
	OpenedAt  *time.Time `json:"opened_at"`
}

// UpdateTradeRequest - ข้อมูลสำหรับปิดหรือแก้ไขออเดอร์ (UPGRADED)
type UpdateTradeRequest struct {
	ExitPrice  float64    `json:"exit_price"`
	PnL        float64    `json:"pnl"`
	PnLPercent float64    `json:"pnl_percent"`
	Status     string     `json:"status"` // WIN, LOSS, BREAK_EVEN
	Notes      string     `json:"notes"`
	ExitTime   *time.Time `json:"exit_time"`
	ClosedAt   *time.Time `json:"closed_at"`
}

// TradeFilter - ตัวกรองสำหรับค้นหา
type TradeFilter struct {
	Status   string `query:"status"`    // OPEN, WIN, LOSS, all
	Pair     string `query:"pair"`      // เช่น BTC/USDT
	Side     string `query:"side"`      // LONG, SHORT
	DateFrom string `query:"date_from"` // 🔥 NEW: Filter by date range
	DateTo   string `query:"date_to"`
	Limit    int    `query:"limit"`
	Offset   int    `query:"offset"`
	SortBy   string `query:"sort_by"`  // 🔥 NEW: created_at, pnl, position_size
	SortDir  string `query:"sort_dir"` // ASC, DESC
}

// ============================================
// Handler Functions
// ============================================

// CreateTrade - สร้างบันทึกการเทรดใหม่
// POST /api/trades
func CreateTrade(c *fiber.Ctx) error {
	// ดึง User ID จาก JWT Token
	userID := GetCurrentUserID(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "ไม่พบข้อมูล User",
		})
	}

	// รับข้อมูลจาก Request Body
	var req CreateTradeRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("❌ CreateTrade parse error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "ข้อมูลไม่ถูกต้อง",
			"message": err.Error(),
		})
	}

	log.Printf("📊 CreateTrade: user=%d, pair=%s, side=%s, size=%.2f", userID, req.Pair, req.Side, req.PositionSize)

	// Validate ข้อมูลพื้นฐาน
	if req.Pair == "" || req.Side == "" || req.EntryPrice <= 0 || req.PositionSize <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "กรุณากรอกข้อมูลให้ครบ (Pair, Side, EntryPrice, PositionSize)",
		})
	}

	// 🔥 Validate Pair format (XXX/XXX, max 50 chars)
	if len(req.Pair) > 50 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "คู่เทรดยาวเกินไป (สูงสุด 50 ตัวอักษร)",
		})
	}
	if !strings.Contains(req.Pair, "/") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รูปแบบคู่เทรดไม่ถูกต้อง (ต้องเป็น XXX/USDT)",
		})
	}

	// เช็ค Side ว่าถูกต้องมั้ย
	if req.Side != "LONG" && req.Side != "SHORT" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Side ต้องเป็น LONG หรือ SHORT เท่านั้น",
		})
	}

	// กำหนดค่า Default
	if req.Leverage <= 0 {
		req.Leverage = 1
	}
	// Set EntryTime to now if not provided
	now := time.Now()
	if req.EntryTime == nil {
		req.EntryTime = &now
	}
	// Set OpenedAt to now if not provided
	if req.OpenedAt == nil {
		req.OpenedAt = &now
	}

	// 🔥 คำนวณ Setup Score อัตโนมัติ (ถ้าไม่ได้ส่งมา)
	if req.SetupScore == 0 && req.RiskRewardRatio > 0 {
		req.SetupScore = calculateSetupScore(req.RiskRewardRatio, req.RiskPercent)
	}

	// สร้าง Trade Object
	trade := Trade{
		UserID:          userID,
		Pair:            req.Pair,
		Side:            req.Side,
		EntryPrice:      req.EntryPrice,
		StopLoss:        req.StopLoss,
		TakeProfit:      req.TakeProfit,
		PositionSize:    req.PositionSize,
		Quantity:        req.Quantity,
		Leverage:        req.Leverage,
		RiskPercent:     req.RiskPercent,
		MaxWin:          req.MaxWin,
		MaxLoss:         req.MaxLoss,
		RiskRewardRatio: req.RiskRewardRatio,
		Fee:             req.Fee,
		EntryReason:     req.EntryReason,
		SetupScore:      req.SetupScore,
		Notes:           req.Notes,
		Tags:            req.Tags,
		EntryTime:       req.EntryTime,
		OpenedAt:        req.OpenedAt,
		Status:          "OPEN",
	}

	// บันทึกลง Database
	if err := database.DB.Create(&trade).Error; err != nil {
		log.Printf("❌ DB Create error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "ไม่สามารถบันทึกได้",
			"message": err.Error(),
		})
	}

	log.Printf("✅ Trade created: id=%d", trade.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "บันทึกการเทรดสำเร็จ! 📊",
		"trade":   trade,
	})
}

// calculateSetupScore - คำนวณคะแนน Setup 1-5 ดาว
// Logic: RR > 3 = 5 stars, RR > 2 = 4 stars, RR > 1.5 = 3 stars
//
//	ถ้า Risk > 5% หัก 1 ดาว, Risk > 10% หัก 2 ดาว
func calculateSetupScore(rr float64, riskPercent float64) int {
	score := 2 // Base score

	// เพิ่มคะแนนตาม R:R
	if rr >= 3 {
		score = 5
	} else if rr >= 2 {
		score = 4
	} else if rr >= 1.5 {
		score = 3
	}

	// หักคะแนนถ้า Risk สูงเกินไป
	if riskPercent > 10 {
		score -= 2
	} else if riskPercent > 5 {
		score -= 1
	}

	// Clamp 1-5
	if score < 1 {
		score = 1
	}
	if score > 5 {
		score = 5
	}

	return score
}

// GetTrades - ดึงประวัติการเทรดทั้งหมดของ User
// GET /api/trades
func GetTrades(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "ไม่พบข้อมูล User",
		})
	}

	var filter TradeFilter
	if err := c.QueryParser(&filter); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Query parameters ไม่ถูกต้อง",
		})
	}

	// Default values
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 50
	}
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	if filter.SortDir == "" {
		filter.SortDir = "DESC"
	}

	// Query
	var trades []Trade
	query := database.DB.Where("user_id = ?", userID)

	// Filters
	if filter.Status != "" && filter.Status != "all" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Pair != "" {
		query = query.Where("pair ILIKE ?", "%"+filter.Pair+"%")
	}
	if filter.Side != "" {
		query = query.Where("side = ?", filter.Side)
	}

	// 🔥 Date Range Filter
	if filter.DateFrom != "" {
		if dateFrom, err := time.Parse("2006-01-02", filter.DateFrom); err == nil {
			query = query.Where("created_at >= ?", dateFrom)
		}
	}
	if filter.DateTo != "" {
		if dateTo, err := time.Parse("2006-01-02", filter.DateTo); err == nil {
			query = query.Where("created_at <= ?", dateTo.Add(24*time.Hour))
		}
	}

	// 🔥 Sorting
	orderClause := filter.SortBy + " " + filter.SortDir
	if err := query.Order(orderClause).
		Limit(filter.Limit).
		Offset(filter.Offset).
		Find(&trades).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "ไม่สามารถดึงข้อมูลได้",
			"message": err.Error(),
		})
	}

	// Count total
	var total int64
	database.DB.Model(&Trade{}).Where("user_id = ?", userID).Count(&total)

	// Stats - คำนวณจาก trades ทั้งหมดของ user (ไม่สนใจ filter)
	var stats struct {
		TotalPnL  float64 `json:"total_pnl"`
		WinCount  int64   `json:"win_count"`
		LossCount int64   `json:"loss_count"`
		OpenCount int64   `json:"open_count"`
		AvgRR     float64 `json:"avg_rr"`
	}
	
	// คำนวณ Total PnL จากทุก trade ที่ปิดแล้ว (WIN, LOSS, BREAK_EVEN)
	database.DB.Model(&Trade{}).
		Where("user_id = ? AND status IN (?)", userID, []string{"WIN", "LOSS", "BREAK_EVEN"}).
		Select("COALESCE(SUM(pnl), 0) as total_pnl, COALESCE(AVG(risk_reward_ratio), 0) as avg_rr").
		Scan(&stats)
	
	database.DB.Model(&Trade{}).Where("user_id = ? AND status = ?", userID, "WIN").Count(&stats.WinCount)
	database.DB.Model(&Trade{}).Where("user_id = ? AND status = ?", userID, "LOSS").Count(&stats.LossCount)
	database.DB.Model(&Trade{}).Where("user_id = ? AND status = ?", userID, "OPEN").Count(&stats.OpenCount)
	
	log.Printf("📊 Stats for user %d: Total PnL=%.2f, Win=%d, Loss=%d, Open=%d", userID, stats.TotalPnL, stats.WinCount, stats.LossCount, stats.OpenCount)

	return c.JSON(fiber.Map{
		"trades": trades,
		"total":  total,
		"stats":  stats,
		"filter": filter,
	})
}

// GetTrade - ดึงข้อมูลเทรดเดียว
// GET /api/trades/:id
func GetTrade(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	tradeID := c.Params("id")

	var trade Trade
	if err := database.DB.Where("id = ? AND user_id = ?", tradeID, userID).First(&trade).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบข้อมูลการเทรดนี้",
		})
	}

	return c.JSON(trade)
}

// UpdateTrade - อัพเดทข้อมูลเทรด (ปิดออเดอร์ หรือแก้ไข)
// PUT /api/trades/:id
func UpdateTrade(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	tradeID := c.Params("id")

	var trade Trade
	if err := database.DB.Where("id = ? AND user_id = ?", tradeID, userID).First(&trade).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบข้อมูลการเทรดนี้",
		})
	}

	var req UpdateTradeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "ข้อมูลไม่ถูกต้อง",
			"message": err.Error(),
		})
	}

	log.Printf("📝 UpdateTrade: id=%d, status=%s, exit_price=%.2f, pnl=%.2f", trade.ID, req.Status, req.ExitPrice, req.PnL)

	// Update fields
	updates := make(map[string]interface{})
	if req.ExitPrice > 0 {
		updates["exit_price"] = req.ExitPrice
	}
	if req.PnL != 0 {
		updates["pnl"] = req.PnL
	}
	if req.PnLPercent != 0 {
		updates["pnl_percent"] = req.PnLPercent
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.ExitTime != nil {
		updates["exit_time"] = req.ExitTime
	}
	if req.ClosedAt != nil {
		updates["closed_at"] = req.ClosedAt
	}

	// Auto-set ClosedAt if status is WIN/LOSS/BREAK_EVEN
	if req.Status == "WIN" || req.Status == "LOSS" || req.Status == "BREAK_EVEN" {
		now := time.Now()
		if req.ClosedAt == nil {
			updates["closed_at"] = &now
		}
		if req.ExitTime == nil {
			updates["exit_time"] = &now
		}
	}

	if err := database.DB.Model(&trade).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "ไม่สามารถอัพเดทได้",
			"message": err.Error(),
		})
	}

	database.DB.First(&trade, trade.ID)

	return c.JSON(fiber.Map{
		"message": "อัพเดทสำเร็จ! ✅",
		"trade":   trade,
	})
}

// DeleteTrade - ลบบันทึกการเทรด
// DELETE /api/trades/:id
func DeleteTrade(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	tradeID := c.Params("id")

	var trade Trade
	if err := database.DB.Where("id = ? AND user_id = ?", tradeID, userID).First(&trade).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบข้อมูลการเทรดนี้",
		})
	}

	if err := database.DB.Delete(&trade).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "ไม่สามารถลบได้",
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "ลบสำเร็จ! 🗑️",
		"id":      trade.ID,
	})
}

// MigrateTradeModels - สร้าง Table trades ใน Database
func MigrateTradeModels() error {
	return database.DB.AutoMigrate(&Trade{})
}
