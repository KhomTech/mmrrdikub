// Package models - เก็บโครงสร้างข้อมูล (Structs) ทั้งหมด
// ไฟล์นี้คือ "พิมพ์เขียว" ของข้อมูลต่างๆ ในระบบ
// GORM จะใช้ Struct เหล่านี้ในการสร้างตารางและ Query อัตโนมัติ
package models

import (
	"time"
)

// User - โครงสร้างข้อมูลผู้ใช้งาน
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;not null;size:50" json:"username"`
	PasswordHash string    `gorm:"not null;size:255" json:"-"` // json:"-" ป้องกันไม่ให้ส่ง password ออกไป
	Role         string    `gorm:"default:user;size:20" json:"role"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// Asset - โครงสร้างข้อมูลคู่เทรด
type Asset struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Symbol    string    `gorm:"uniqueIndex;not null;size:20" json:"symbol"`
	Type      string    `gorm:"not null;size:20" json:"type"` // Crypto, Forex
	TickSize  float64   `gorm:"not null" json:"tick_size"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// Exchange - โครงสร้างข้อมูลกระดานเทรด
type Exchange struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"uniqueIndex;not null;size:50" json:"name"`
	MakerFee  float64   `gorm:"default:0" json:"maker_fee"`
	TakerFee  float64   `gorm:"default:0" json:"taker_fee"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// TradeJournal - โครงสร้างข้อมูลบันทึกการเทรด (ตารางแม่)
type TradeJournal struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	UserID          uint        `gorm:"not null" json:"user_id"`
	User            User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	AssetID         uint        `gorm:"not null" json:"asset_id"`
	Asset           Asset       `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	ExchangeID      uint        `gorm:"not null" json:"exchange_id"`
	Exchange        Exchange    `gorm:"foreignKey:ExchangeID" json:"exchange,omitempty"`
	EntryPrice      float64     `gorm:"not null" json:"entry_price"`
	Leverage        float64     `gorm:"default:1.0" json:"leverage"`
	Direction       string      `gorm:"not null;size:10" json:"direction"` // Long, Short
	TotalRiskAmount float64     `gorm:"not null" json:"total_risk_amount"`
	Status          string      `gorm:"default:Open;size:20" json:"status"` // Open, Closed
	Notes           string      `gorm:"type:text" json:"notes,omitempty"`
	ImageURL        string      `gorm:"type:text" json:"image_url,omitempty"`
	TradeExits      []TradeExit `gorm:"foreignKey:TradeJournalID" json:"trade_exits,omitempty"`
	CreatedAt       time.Time   `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time   `gorm:"autoUpdateTime" json:"updated_at"`
}

// TradeExit - โครงสร้างข้อมูลจุดออก (ตารางลูก)
// มีความสัมพันธ์ One-to-Many กับ TradeJournal (1 Journal มีได้หลายจุดออก)
type TradeExit struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	TradeJournalID uint      `gorm:"not null" json:"trade_journal_id"`
	Type           string    `gorm:"not null;size:10" json:"type"` // TP, SL
	Price          float64   `gorm:"not null" json:"price"`
	PercentWeight  float64   `gorm:"not null" json:"percent_weight"` // เปอร์เซ็นต์ที่ขาย
	IsExecuted     bool      `gorm:"default:false" json:"is_executed"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}
