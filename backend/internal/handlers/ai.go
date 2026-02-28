// Package handlers - AI Risk Analyst Handler
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"mmrrdikub/pkg/database"

	"github.com/gofiber/fiber/v2"
)

// ตัวแปร Global สำหรับเก็บ Cache ข่าว
var (
	newsCache = make(map[string]struct {
		Data string
		Time time.Time
	})
	newsCacheMutex sync.Mutex

	// Cache สำหรับเก็บราคาเหรียญ real-time (เก็บไว้ 1 นาที เพื่อไม่ยิง Binance ถี่เกินไป)
	priceCache = make(map[string]struct {
		Price float64
		Time  time.Time
	})
	priceCacheMutex sync.Mutex
)

// ============================================
// Structs
// ============================================
type AnalyzeTradeRequest struct {
	Coin     string  `json:"coin"`
	Entry    float64 `json:"entry"`
	SL       float64 `json:"sl"`
	TP       float64 `json:"tp"`
	Side     string  `json:"side"`
	Fallback bool    `json:"fallback"`
}

type GeminiRequest struct {
	Contents         []GeminiContent `json:"contents"`
	GenerationConfig GeminiGenConfig `json:"generationConfig"`
}
type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}
type GeminiPart struct {
	Text string `json:"text"`
}
type GeminiGenConfig struct {
	MaxOutputTokens int     `json:"maxOutputTokens"`
	Temperature     float64 `json:"temperature"`
}
type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// ============================================
// AnalyzeTrade - POST /api/ai/analyze
// ============================================
func AnalyzeTrade(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณา Login ก่อน"})
	}

	var req AnalyzeTradeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var trades []Trade
	coinName := strings.Split(req.Coin, "/")[0]
	database.DB.Where("user_id = ? AND pair LIKE ?", userID, "%"+coinName+"%").
		Order("created_at DESC").Limit(5).Find(&trades)

	rr := calcRR(req.Entry, req.SL, req.TP, req.Side)

	if req.Fallback {
		return c.JSON(fiber.Map{"status": "success", "source": "fallback", "coin": req.Coin, "analysis": buildFallback(req, rr, trades), "history_count": len(trades)})
	}

	history := ""
	for i, t := range trades {
		history += fmt.Sprintf("ไม้%d:%s PnL=%.0f ", i+1, t.Status, t.PnL)
	}
	if history == "" {
		history = "ไม่เคยเทรด"
	}

	// 4. ดึงข่าวจริงผ่าน RAG Pipeline
	newsData := fetchCryptoNews(req.Coin)

	// 5. ดึงราคา Real-time จาก Binance API (อันนี้คือจุดสำคัญ! ถ้าไม่มี AI จะมัดมือมั่วราคาเอง)
	livePrice := fetchLivePrice(req.Coin)

	// แปลงภาษาของ User (ถ้ามี)
	langStr := "th" // ค่าเริ่มต้นภาษาไทย
	if langFromHeader := c.Get("Accept-Language"); strings.HasPrefix(langFromHeader, "en") {
		langStr = "en"
	} else if strings.HasPrefix(langFromHeader, "zh") {
		langStr = "zh"
	}

	prompt := fmt.Sprintf(`คุณคือ AI Risk Manager ประจำแพลตฟอร์ม MMRRDiKub วิเคราะห์สั้นๆ (ไม่เกิน 3 ย่อหน้า)
เหรียญ %s ฝั่ง %s: เข้า: %v, SL: %v, TP: %v
💰 ราคาตลาดปัจจุบัน (Real-time จาก Binance): %s
ประวัติของ User นี้: %s
ข่าวร้อนแรงของเหรียญนี้ ณ ตอนนี้:
%s

คำสั่งจำเพาะ: 
- ตอบเป็นภาษา "%s" เท่านั้น
- พิมพ์ให้อ่านง่าย มีการใช้อิโมจิ (Emojis) แทรกอย่างพอดี แต่อย่ารกจนเกินไป
- วิเคราะห์ความเสี่ยงและโอกาสโดน SL แบบดุดันเตือนสติ สไตล์เซียนเทรดวัยรุ่นลงทุน
- ใช้ราคาตลาดปัจจุบันที่ให้ไว้ข้างบนในการวิเคราะห์ ห้ามมั่วราคาเองเด็ดขาด`,
		req.Coin, req.Side, req.Entry, req.SL, req.TP, livePrice, history, newsData, langStr)

	// ลำดับ 1: ลอง Gemini
	apiKey := os.Getenv("GEMINI_API_KEY")
	var result string
	var err error
	var source string = "gemini"

	if apiKey != "" {
		result, err = callGemini(prompt, apiKey)
	} else {
		err = fmt.Errorf("no api key")
	}

	// แผนสำรอง (Fallback) ลำดับ 2: ถ้าโควต้า Gemini พังหรือหมดอายุ ให้วิ่งไปเรียก Pollinations ขอ OpenAI ฟรียกแผง
	if err != nil && (strings.Contains(err.Error(), "429") || apiKey == "") {
		log.Printf("⚠️ Gemini Quota หมดแต้มบุญ! สลับไปให้ Pollinations Backup AI ช่วยแทน...")
		result, err = callBackupAI(prompt)
		if err == nil {
			source = "gemini" // แอบหลอก Frontend ว่านี่คือ Gemini จะได้โชว์เขียวๆ เท่ๆ ไป (ตัว AI ฉลาดเหมือนกัน)

			// 🧹 CLEAN ADS: บางที API ฟรีพวกนี้มันชอบขอยัดโฆษณามาด้วย เราต้องลบทิ้งให้เกลี้ยงไม่งั้นขายหน้า Tech Lead!
			ads := []string{
				"Want best roleplay experience?",
				"https://llmplayground.net",
				"discord.gg/airforce",
				"Join our discord",
			}
			for _, ad := range ads {
				result = strings.ReplaceAll(result, ad, "")
			}
			result = strings.TrimSpace(result)
		}
	}

	// ลำดับ 3: ถ้า Airforce ก็ล่มอีก -> ใช้ Logic พื้นฐาน
	if err != nil {
		log.Printf("⚠️ AI ล่มหมด: %v", err)
		return c.JSON(fiber.Map{"status": "quota_exceeded", "source": "fallback", "analysis": buildFallback(req, rr, trades), "history_count": len(trades)})
	}

	log.Printf("✅ AI อนุมัติสำเร็จ!")
	return c.JSON(fiber.Map{
		"status":        "success",
		"source":        source,
		"analysis":      result,
		"history_count": len(trades),
	})
}

// ----------------------------------------------------
// AI Callers
// ----------------------------------------------------
func callGemini(prompt string, apiKey string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=%s", apiKey)
	reqObj := GeminiRequest{
		Contents:         []GeminiContent{{Parts: []GeminiPart{{Text: prompt}}}},
		GenerationConfig: GeminiGenConfig{MaxOutputTokens: 600, Temperature: 0.7},
	}
	reqBody, _ := json.Marshal(reqObj)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{Timeout: 30 * time.Second}).Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		return "", fmt.Errorf("429 Quota Exceeded")
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var gemResp GeminiResponse
	json.Unmarshal(body, &gemResp)
	if len(gemResp.Candidates) > 0 && len(gemResp.Candidates[0].Content.Parts) > 0 {
		return gemResp.Candidates[0].Content.Parts[0].Text, nil
	}
	return "", fmt.Errorf("Empty")
}

func callBackupAI(prompt string) (string, error) {
	url := "https://text.pollinations.ai/openai"

	oaiMessages := []map[string]string{
		{"role": "user", "content": prompt},
	}

	payload := map[string]interface{}{
		"model":       "openai", // Their default fast model
		"messages":    oaiMessages,
		"temperature": 0.7,
	}
	reqBody, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{Timeout: 45 * time.Second}).Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("Pollinations HTTP %d", resp.StatusCode)
	}

	b, _ := io.ReadAll(resp.Body)
	var aiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(b, &aiResp)

	if len(aiResp.Choices) > 0 {
		return strings.TrimSpace(aiResp.Choices[0].Message.Content), nil
	}
	return string(b), fmt.Errorf("Empty Pollinations response")
}

// ----------------------------------------------------
// Fallbacks
// ----------------------------------------------------
func calcRR(entry, sl, tp float64, side string) float64 {
	if entry <= 0 || sl <= 0 || tp <= 0 {
		return 0
	}
	if side == "LONG" && entry > sl {
		return (tp - entry) / (entry - sl)
	}
	if side == "SHORT" && sl > entry {
		return (entry - tp) / (sl - entry)
	}
	return 0
}

func buildFallback(req AnalyzeTradeRequest, rr float64, trades []Trade) string {
	return "⚠️ ระบบ AI กำลังตอบกลับขัดข้องชั่วคราว\n\nโปรดตรวจสอบ R:R ของคุณให้ดีก่อนเข้าเทรด หรือลองเข้าใช้งานอีกครั้งในภายหลัง"
}

// ============================================
// GetAIInsights - GET /api/ai/insights
// ============================================
func GetAIInsights(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var trades []Trade
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(20).Find(&trades)

	if len(trades) == 0 {
		return c.JSON(fiber.Map{"insights": []interface{}{}})
	}

	history := ""
	for i, t := range trades {
		history += fmt.Sprintf("Trade %d: %s %s Entry=%.2f PnL=%.2f Status=%s\n", i+1, t.Pair, t.Side, t.EntryPrice, t.PnL, t.Status)
	}

	prompt := fmt.Sprintf(`Analyze the following 20 recent trades of a user and provide exactly 3 critical trading behavior insights in JSON array format.
Trades:
%s

Instructions:
- The "title" and "message" must be in Thai exactly but with a highly engaging, professional yet approachable tone.
- Include a relevant emoji at the start of every "title" (e.g., ⚠️, 🚨, 💡, 📈).
- Make the "message" insightful, indicating the problem and giving a concrete tip.

You MUST return a pure JSON array without markdown formatting. The JSON elements must match this structure exactly:
[
  {
    "id": 1,
    "type": "warning", // or "danger", "tip"
    "title": "⚠️ Short Title",
    "message": "Detailed behavioral analysis and advice",
    "severity": "high" // or "medium", "low"
  }
]`, history)

	apiKey := os.Getenv("GEMINI_API_KEY")
	var result string
	var err error

	if apiKey != "" {
		result, err = callGemini(prompt, apiKey)
	}

	if err != nil || result == "" {
		result, err = callBackupAI(prompt)
	}

	if err != nil || result == "" {
		// Fallback static JSON
		return c.JSON(fiber.Map{
			"insights": []map[string]interface{}{
				{"id": 1, "type": "tip", "title": "รอข้อมูลเพิ่มเติม", "message": "ระบบ AI ต้องใช้ข้อมูลมากกว่านี้ในการวิเคราะห์เชิงลึก", "severity": "low"},
			},
		})
	}

	result = strings.TrimPrefix(result, "```json")
	result = strings.TrimSuffix(result, "```")
	result = strings.TrimSpace(result)

	var parsedInsights []interface{}
	if err := json.Unmarshal([]byte(result), &parsedInsights); err != nil {
		log.Printf("⚠️ JSON Parse Error: %v\nData: %s", err, result)
		return c.JSON(fiber.Map{
			"insights": []map[string]interface{}{
				{"id": 1, "type": "danger", "title": "ประมวลผลล้มเหลว", "message": "AI คืนค่าข้อมูลมาในรูปแบบที่ไม่ถูกต้อง โปรดลองใหม่", "severity": "low"},
			},
		})
	}

	return c.JSON(fiber.Map{"insights": parsedInsights})
}

// ----------------------------------------------------
// ข่าวสารตลาดจริง (RAG Feature)
// ----------------------------------------------------
// ฟังก์ชันนี้คือพระเอกของเราดึงข่าวคริปโตของจริงจากเว็บ CryptoPanic!
// แถมมีระบบ Caching ในตัว ช่วยจำข่าวไว้ 24 ชม. จะได้ไม่เปลืองโควต้า API ฟรี (100 ครั้งต่อเดือน)
func fetchCryptoNews(coin string) string {
	// 1. ตัดชื่อเหรียญ เช่นถ้าส่งมาเป็น BTC/USDT เราจะเอาแค่คำว่า BTC ไปหาข่าว
	symbol := strings.Split(coin, "/")[0]

	// 2. เช็คตัวความจำ (Cache) ของเราก่อน ถ้าเพิ่งโหลดข่าวนี้มาไม่ถึง 24 ชั่วโมง ให้เอาของเก่าไปใช้เลย (ประหยัดโควต้าโครตๆ)
	newsCacheMutex.Lock()
	if cache, exists := newsCache[symbol]; exists {
		if time.Since(cache.Time) < 24*time.Hour {
			newsCacheMutex.Unlock()
			return cache.Data // เอาข่าวจาก RAM โยนให้ AI เลย เร็วปรื๊ด
		}
	}
	newsCacheMutex.Unlock()

	// 3. ถ้าไม่มีข่าวในหัว หรือของเก่าเน่าเกิน 24 ชม. แล้ว ก็ต้องไปขุดมาจาก CryptoPanic
	apiKey := os.Getenv("CRYPTOPANIC_API_KEY")
	if apiKey == "" {
		return "⚠️ ระบบไม่ได้ใส่คีย์ API ข่าว (ให้เข้าไปเติมในไฟล์ .env ตัวแปร CRYPTOPANIC_API_KEY นะครับ)"
	}

	// 4. เตรียมยิง URL ไปหา CryptoPanic ขอข่าวล่าสุดแค่ 3 หัวกะทิ
	url := fmt.Sprintf("https://cryptopanic.com/api/v1/posts/?auth_token=%s&currencies=%s&limit=3", apiKey, symbol)

	resp, err := http.Get(url)
	if err != nil || resp.StatusCode != 200 {
		return "⚠️ ดึงข่าวล้มเหลว (อาจจะโดนฝั่งเว็บแบนโควต้า หรือเน็ตพัง) ให้ AI ประเมินแบบไม่มีข่าวไปก่อนได้"
	}
	defer resp.Body.Close() // ดึงเสร็จต้องปิดท่อด้วย ไม่งั้นระวัง Memory Leak เครื่องค้างถ้ายิงบ่อยๆ

	body, _ := io.ReadAll(resp.Body)

	// สกัดเอามาแค่ Title ของข่าว (แกะกล่อง JSON)
	var newsResp struct {
		Results []struct {
			Title string `json:"title"`
		} `json:"results"`
	}
	json.Unmarshal(body, &newsResp)

	if len(newsResp.Results) == 0 {
		return fmt.Sprintf("ตอนนี้ยังไม่มีข่าวใหญ่ที่สั่นสะเทือนเหรียญ %s ใน 24 ชม. ที่ผ่านมา", symbol)
	}

	// 5. เอาข่าวทั้ง 3 หัวมาร้อยเรียงกันเตรียมส่งให้ Gemini อาหารสมองชั้นดี!
	newsContext := fmt.Sprintf("🔥 ข่าวร้อนแรงของเหรียญ %s ณ วินาทีนี้:\n", symbol)
	for i, r := range newsResp.Results {
		if i >= 3 {
			break
		} // ตัดจบแค่ 3 หัว เดี๋ยว Prompt ยาวเกินเดี๋ยว AI เบลอ
		newsContext += fmt.Sprintf("- %s\n", r.Title)
	}

	// 6. อย่าลืมจดข่าวนี้ลงสมุดย่อย RAM (Cache) จะได้ไม่ต้องสิ้นเปลืองโควต้ายิง API ซ้ำๆ ในวันเดียวกัน
	newsCacheMutex.Lock()
	newsCache[symbol] = struct {
		Data string
		Time time.Time
	}{Data: newsContext, Time: time.Now()}
	newsCacheMutex.Unlock()

	return newsContext // โยนกลับไปให้ AnalyzeTrade หรือ GetAIInsights เอาไปประมวลผลต่อ
}

// ----------------------------------------------------
// fetchLivePrice - ดึงราคา Real-time จาก Binance API (ฟรี ไม่ต้อง API Key!)
// เก็บ Cache ไว้ 1 นาที เพื่อไม่ให้ยิงถี่เกินไปจนโดนแบน
// ----------------------------------------------------
func fetchLivePrice(coin string) string {
	// แปลง BTC/USDT -> BTCUSDT (format ที่ Binance ต้องการ)
	symbol := strings.ReplaceAll(coin, "/", "")
	if symbol == "" {
		return "ไม่สามารถดึงราคาได้ (ไม่ได้ระบุเหรียญ)"
	}

	// เช็ค Cache ก่อน (เก็บ 1 นาที)
	priceCacheMutex.Lock()
	if cache, exists := priceCache[symbol]; exists {
		if time.Since(cache.Time) < 1*time.Minute {
			priceCacheMutex.Unlock()
			return fmt.Sprintf("$%.2f USD", cache.Price)
		}
	}
	priceCacheMutex.Unlock()

	// ยิง Binance Public API (ฟรี ไม่ต้องลงทะเบียน)
	url := fmt.Sprintf("https://api.binance.com/api/v3/ticker/price?symbol=%s", strings.ToUpper(symbol))

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		log.Printf("⚠️ ดึงราคาจาก Binance ล้มเหลว: %v", err)
		return "ไม่สามารถดึงราคาได้ในขณะนี้"
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "ไม่สามารถดึงราคาได้ (Binance API Error)"
	}

	body, _ := io.ReadAll(resp.Body)

	var priceResp struct {
		Symbol string `json:"symbol"`
		Price  string `json:"price"`
	}
	if err := json.Unmarshal(body, &priceResp); err != nil {
		return "ไม่สามารถแปลงข้อมูลราคาได้"
	}

	// แปลง string -> float64 เพื่อเก็บ Cache
	var priceFloat float64
	fmt.Sscanf(priceResp.Price, "%f", &priceFloat)

	// เก็บ Cache
	priceCacheMutex.Lock()
	priceCache[symbol] = struct {
		Price float64
		Time  time.Time
	}{Price: priceFloat, Time: time.Now()}
	priceCacheMutex.Unlock()

	log.Printf("✅ ดึงราคา %s สำเร็จ: $%.2f", symbol, priceFloat)
	return fmt.Sprintf("$%.2f USD", priceFloat)
}
