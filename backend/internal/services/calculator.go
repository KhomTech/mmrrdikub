// Package services - Position Size Calculator
// ตัวคำนวณขนาดไม้ที่รวม Fee และ Weighted SL ไว้แล้ว
package services

import (
	"errors"
	"math"
)

// StopLoss - แต่ละจุด SL ที่ตั้งไว้ พร้อมน้ำหนัก
type StopLoss struct {
	Price  float64 // ราคา SL ที่ตั้งไว้
	Weight float64 // น้ำหนัก (เช่น 0.5 = 50% ของไม้ จะโดนตัดที่จุดนี้)
}

// CalculationInput - ข้อมูลที่ต้องใส่มาคำนวณ
type CalculationInput struct {
	Balance     float64    // เงินทุนทั้งหมด (USD)
	RiskPercent float64    // % ที่ยอมขาดทุนต่อไม้ (เช่น 1.0 = 1%)
	EntryPrice  float64    // ราคาเข้า Entry
	StopLosses  []StopLoss // ลิสต์ของจุด SL หลายๆ จุด พร้อมน้ำหนัก
	Leverage    float64    // ตัวคูณ Leverage (ถ้าไม่ใช้ใส่ 1)
	FeeRate     float64    // ค่า Fee ต่อครั้ง (เช่น 0.0004 = 0.04%)
}

// CalculationResult - ผลลัพธ์ที่ได้จากการคำนวณ
type CalculationResult struct {
	PositionSizeUSD  float64 // มูลค่ารวมของไม้ (USD)
	PositionQuantity float64 // จำนวนเหรียญที่จะซื้อ/ขาย
	WeightedAvgSL    float64 // ราคา SL เฉลี่ย (ถ่วงน้ำหนัก)
	TotalFeeEstimate float64 // ค่า Fee รวมโดยประมาณ (Entry + Exit)
}

// CalculatePositionSize - ฟังก์ชันหลักสำหรับคำนวณขนาดไม้
// รับ input แล้วคืน result พร้อม error ถ้ามีปัญหา
func CalculatePositionSize(input CalculationInput) (CalculationResult, error) {
	// เช็คก่อนว่าข้อมูลที่ใส่มาถูกต้องมั้ย
	if err := validateInput(input); err != nil {
		return CalculationResult{}, err
	}

	// --- Logic 1: คำนวณ Weighted SL (SL เฉลี่ยถ่วงน้ำหนัก) ---
	// ตรงนี้รวม SL หลายจุด โดยคิดตามน้ำหนักที่ตั้งไว้
	weightedAvgSL := calculateWeightedSL(input.StopLosses)

	// --- คำนวณค่าพื้นฐาน ---
	// หาจำนวนเงินที่ยอม Risk (เช่น Balance 1000, Risk 1% = 10 USD)
	riskAmount := input.Balance * (input.RiskPercent / 100)

	// หา Distance (ระยะห่างจาก Entry ถึง SL เฉลี่ย)
	// ใช้ math.Abs เพราะอาจเป็น Long หรือ Short ก็ได้
	distance := math.Abs(input.EntryPrice - weightedAvgSL)

	// --- Logic 2: Fee Adjustment (The Killer Feature) ---
	// ปกติ: Size = RiskAmount / Distance
	// แต่! ถ้าโดน SL จริง เราต้องเสีย Fee ด้วย
	// เลยเอา Fee มาบวกเป็นตัวหาร กันงบหลุด!
	// สูตร: Size = RiskAmount / (Distance + Fee_Entry + Fee_SL)
	feeAtEntry := input.EntryPrice * input.FeeRate     // ค่า Fee ตอนเปิดไม้
	feeAtSL := weightedAvgSL * input.FeeRate           // ค่า Fee ตอนโดน SL
	adjustedDivisor := distance + feeAtEntry + feeAtSL // ตัวหารที่รวม Fee แล้ว

	// กัน Divide by Zero (ถ้า Entry กับ SL เท่ากันพอดี)
	if adjustedDivisor == 0 {
		return CalculationResult{}, errors.New("ระยะห่าง Entry-SL เท่ากับ 0 คำนวณไม่ได้")
	}

	// --- คำนวณ Position Size ---
	// Size = จำนวน Risk หารด้วยตัวหารที่ปรับแล้ว
	positionQuantity := riskAmount / adjustedDivisor

	// --- Logic 3: แปลง Quantity เป็น USD ---
	// เอาจำนวนเหรียญ คูณราคา Entry = มูลค่าไม้เป็น USD
	positionSizeUSD := positionQuantity * input.EntryPrice

	// --- คำนวณ Fee รวมโดยประมาณ ---
	// Fee = มูลค่าไม้ x FeeRate x 2 (เปิด 1 ครั้ง + ปิด 1 ครั้ง)
	totalFeeEstimate := positionSizeUSD * input.FeeRate * 2

	// คืนผลลัพธ์ครบทุกค่า
	return CalculationResult{
		PositionSizeUSD:  round(positionSizeUSD, 2),  // ปัดทศนิยม 2 ตำแหน่ง
		PositionQuantity: round(positionQuantity, 6), // เหรียญเอาเยอะหน่อย 6 ตำแหน่ง
		WeightedAvgSL:    round(weightedAvgSL, 2),    // ปัดทศนิยม 2 ตำแหน่ง
		TotalFeeEstimate: round(totalFeeEstimate, 4), // ปัดทศนิยม 4 ตำแหน่ง
	}, nil
}

// calculateWeightedSL - คำนวณ SL เฉลี่ยแบบถ่วงน้ำหนัก
// ตัวอย่าง: SL1=90 (น้ำหนัก 0.6), SL2=85 (น้ำหนัก 0.4)
// ผลลัพธ์: (90*0.6 + 85*0.4) / (0.6+0.4) = 88
func calculateWeightedSL(stopLosses []StopLoss) float64 {
	var totalWeight float64 // น้ำหนักรวม
	var weightedSum float64 // ผลรวมแบบถ่วงน้ำหนัก

	// วนลูปรวมค่าทุกจุด SL
	for _, sl := range stopLosses {
		weightedSum += sl.Price * sl.Weight // เอาราคา x น้ำหนัก
		totalWeight += sl.Weight            // รวมน้ำหนักไว้
	}

	// กัน Divide by Zero
	if totalWeight == 0 {
		return 0
	}

	// คืนค่าเฉลี่ยถ่วงน้ำหนัก
	return weightedSum / totalWeight
}

// validateInput - เช็คว่าข้อมูลที่ใส่มาถูกต้องมั้ย
// ถ้าเจอปัญหาจะคืน error กลับไป
func validateInput(input CalculationInput) error {
	// Balance ต้องมากกว่า 0
	if input.Balance <= 0 {
		return errors.New("Balance ต้องมากกว่า 0")
	}

	// Risk% ต้องอยู่ระหว่าง 0-100
	if input.RiskPercent <= 0 || input.RiskPercent > 100 {
		return errors.New("RiskPercent ต้องอยู่ระหว่าง 0-100")
	}

	// Entry ต้องมากกว่า 0
	if input.EntryPrice <= 0 {
		return errors.New("EntryPrice ต้องมากกว่า 0")
	}

	// ต้องมี SL อย่างน้อย 1 จุด
	if len(input.StopLosses) == 0 {
		return errors.New("ต้องระบุ StopLoss อย่างน้อย 1 จุด")
	}

	// เช็คแต่ละ SL ว่าถูกต้องมั้ย
	for i, sl := range input.StopLosses {
		if sl.Price <= 0 {
			return errors.New("StopLoss ราคาต้องมากกว่า 0")
		}
		if sl.Weight <= 0 {
			return errors.New("StopLoss น้ำหนักต้องมากกว่า 0")
		}
		// เตือนถ้า SL เท่ากับ Entry (แต่ปล่อยผ่าน เผื่อเป็น case พิเศษ)
		if sl.Price == input.EntryPrice {
			_ = i // suppress unused variable warning
		}
	}

	// Leverage ถ้าใส่มาต้องมากกว่า 0
	if input.Leverage < 0 {
		return errors.New("Leverage ต้องมากกว่าหรือเท่ากับ 0")
	}

	// FeeRate ต้องไม่เป็นลบ
	if input.FeeRate < 0 {
		return errors.New("FeeRate ต้องไม่เป็นลบ")
	}

	return nil
}

// round - ปัดทศนิยมให้ได้ตำแหน่งที่ต้องการ
// ใช้ math.Round ช่วย เพราะ Go ไม่มี built-in
func round(val float64, precision int) float64 {
	// สร้างตัวคูณ (เช่น precision=2 จะได้ 100)
	p := math.Pow(10, float64(precision))
	// คูณ ปัด แล้วหาร กลับมา
	return math.Round(val*p) / p
}
