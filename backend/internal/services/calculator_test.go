package services

import (
	"math"
	"testing"
)

// TestCalculatePositionSize - ฟังก์ชันทดสอบหลักสำหรับคำนวณ Position Size
// ใช้ Table Driven Test เพื่อทดสอบหลายๆ กรณีในฟังก์ชันเดียว
func TestCalculatePositionSize(t *testing.T) {

	// กำหนด Test Cases ต่างๆ
	tests := []struct {
		name     string                                               // ชื่อเคสทดสอบ
		input    CalculationInput                                     // ข้อมูล Input ที่จะส่งเข้าไป
		verifyFn func(t *testing.T, res CalculationResult, err error) // ฟังก์ชันสำหรับตรวจสอบผลลัพธ์
	}{
		{
			name: "Case ปกติ: ทุน 1000, Risk 1%, ไม่คิด Fee",
			// ทุน 1000, Risk 1% (10$), Entry 100, SL 99 (ระยะ 1)
			// Expected: Size = Risk / Distance = 10 / 1 = 10 units
			// Value = 10 * 100 = 1000 USD
			input: CalculationInput{
				Balance:     1000,
				RiskPercent: 1.0,
				EntryPrice:  100,
				StopLosses: []StopLoss{
					{Price: 99, Weight: 1.0},
				},
				Leverage: 1,
				FeeRate:  0,
			},
			verifyFn: func(t *testing.T, res CalculationResult, err error) {
				if err != nil {
					t.Errorf("ไม่ควรมี error แต่ได้: %v", err)
				}
				// ตรวจสอบ Position Size (USD)
				expectedSizeUSD := 1000.0
				if res.PositionSizeUSD != expectedSizeUSD {
					t.Errorf("Expected SizeUSD %.2f but got %.2f", expectedSizeUSD, res.PositionSizeUSD)
				}
				// ตรวจสอบ Quantity
				expectedQty := 10.0
				if res.PositionQuantity != expectedQty {
					t.Errorf("Expected Quantity %.2f but got %.2f", expectedQty, res.PositionQuantity)
				}
			},
		},
		{
			name: "Case มี Fee (Killer Feature): ต้องลด Size ลงเพื่อกันค่า Fee",
			// ทุน 1000, Risk 1% (10$), Entry 100, SL 99, Fee 0.1% (0.001)
			// Distance = 1
			// Fee Entry = 100 * 0.001 = 0.1
			// Fee SL = 99 * 0.001 = 0.099
			// Divisor = 1 + 0.1 + 0.099 = 1.199
			// Size (Qty) = 10 / 1.199 ≈ 8.340283...
			// Size (USD) = 8.34... * 100 ≈ 834.02...
			input: CalculationInput{
				Balance:     1000,
				RiskPercent: 1.0,
				EntryPrice:  100,
				StopLosses: []StopLoss{
					{Price: 99, Weight: 1.0},
				},
				Leverage: 1,
				FeeRate:  0.001, // 0.1%
			},
			verifyFn: func(t *testing.T, res CalculationResult, err error) {
				if err != nil {
					t.Errorf("ไม่ควรมี error แต่ได้: %v", err)
				}
				// Size ต้องน้อยกว่า 1000 แน่นอน เพราะต้องเผื่อค่า Fee
				if res.PositionSizeUSD >= 1000 {
					t.Errorf("Size รวม Fee แล้วควรน้อยกว่า 1000 แต่ได้ %.2f", res.PositionSizeUSD)
				}

				// คำนวณค่าคาดหวังแบบละเอียด
				expectedDivisor := 1.0 + (100 * 0.001) + (99 * 0.001) // 1.199
				expectedQty := 10.0 / expectedDivisor

				// ตรวจสอบ Quantity (ยอมรับความคลาดเคลื่อนทศนิยมได้นิดหน่อย)
				if math.Abs(res.PositionQuantity-expectedQty) > 0.0001 {
					t.Errorf("Expected Quantity %.4f but got %.4f", expectedQty, res.PositionQuantity)
				}
			},
		},
		{
			name: "Case แบ่งไม้ SL: 2 ไม้ น้ำหนักเท่ากัน",
			// ทุน 1000, Risk 1% (10$), Entry 100
			// SL1: 99 (50%), SL2: 98 (50%)
			// Weighted Avg SL = (99*0.5 + 98*0.5) = 98.5
			// Distance = 100 - 98.5 = 1.5
			// Size (Qty) = 10 / 1.5 ≈ 6.666...
			input: CalculationInput{
				Balance:     1000,
				RiskPercent: 1.0,
				EntryPrice:  100,
				StopLosses: []StopLoss{
					{Price: 99, Weight: 0.5},
					{Price: 98, Weight: 0.5},
				},
				Leverage: 1,
				FeeRate:  0,
			},
			verifyFn: func(t *testing.T, res CalculationResult, err error) {
				if err != nil {
					t.Errorf("ไม่ควรมี error แต่ได้: %v", err)
				}

				// ตรวจสอบ Weighted Avg SL
				expectedAvgSL := 98.5
				if res.WeightedAvgSL != expectedAvgSL {
					t.Errorf("Expected AvgSL %.2f but got %.2f", expectedAvgSL, res.WeightedAvgSL)
				}

				// ตรวจสอบ Quantity
				expectedQty := 10.0 / 1.5 // 6.666...

				// ยอมรับความคลาดเคลื่อนจากการปัดเศษใน Code (ปัด 6 ตำแหน่ง)
				if math.Abs(res.PositionQuantity-expectedQty) > 0.00001 {
					t.Errorf("Expected Quantity %.4f but got %.4f", expectedQty, res.PositionQuantity)
				}
			},
		},
	}

	// วนลูป Run Test Case ทีละอัน
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// เรียกฟังก์ชันที่Test
			result, err := CalculatePositionSize(tc.input)
			// เรียกฟังก์ชันตรวจสอบผล
			tc.verifyFn(t, result, err)
		})
	}
}
