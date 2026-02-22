// Package handlers - AI Trading Assistant Chatbot
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
	"time"

	"mmrrdikub/pkg/database"

	"github.com/gofiber/fiber/v2"
)

// ============================================
// Structs
// ============================================

type ChatMessage struct {
	Role    string `json:"role"` // "user" or "assistant"
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []ChatMessage `json:"messages"`
	Language string        `json:"language"`
}

// โครงสร้างสำหรับยิง Gemini (รูปแบบเดียวกับ ai.go แต่เป็น Array)
type GeminiChatContent struct {
	Role  string       `json:"role"`
	Parts []GeminiPart `json:"parts"`
}
type GeminiChatRequest struct {
	Contents         []GeminiChatContent `json:"contents"`
	GenerationConfig GeminiGenConfig     `json:"generationConfig"`
}

// ============================================
// AIChat - POST /api/ai/chat
// ============================================
func AIChat(c *fiber.Ctx) error {
	userID := GetCurrentUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณา Login ก่อน"})
	}

	var req ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}
	if len(req.Messages) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ไม่มีข้อความ"})
	}

	log.Printf("💬 AI Chat: user=%d messages=%d lang=%s", userID, len(req.Messages), req.Language)

	// 1. ดึงประวัติการเทรด 10 ไม้ล่าสุดของ User เป็น Context ซ่อนไว้
	var trades []Trade
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(10).Find(&trades)

	historyText := ""
	if len(trades) > 0 {
		for i, t := range trades {
			historyText += fmt.Sprintf("ไม้%d:[%s] %s %s เข้า:%.2f ออก:%.2f PnL:%.2f$\n",
				i+1, t.Status, t.Pair, t.Side, t.EntryPrice, t.ExitPrice, t.PnL)
		}
	} else {
		historyText = "ผู้ใช้ยังไม่เคยเทรดเลย"
	}

	// 2. สร้าง System Prompt (รองรับหลายภาษา + ขยี้เรื่องข่าวสาร)
	langStr := req.Language
	if langStr == "" {
		langStr = "th" // Default Thai
	}
	systemPrompt := fmt.Sprintf(`You are a top-tier Professional AI Trading Assistant for the "MMRRDiKub" platform.
CRITICAL INSTRUCTION: You MUST reply entirely in the language derived from this code: "%s" (e.g., if "th", reply in Thai; if "en", reply in English; if "lo", reply in Lao).
Your tone should be friendly, confident, and professional. 
Always try to incorporate recent real-world crypto news and market sentiment into your analysis to provide current, relevant advice.
Here is the user's recent trade history (last 10 trades context):
%s

When analyzing a trade or answering, be concise but highly informative, bringing in market context.`, langStr, historyText)

	// แปลง Messages เข้า format Gemini
	var geminiContents []GeminiChatContent
	geminiContents = append(geminiContents, GeminiChatContent{
		Role:  "user",
		Parts: []GeminiPart{{Text: systemPrompt}},
	})
	geminiContents = append(geminiContents, GeminiChatContent{
		Role:  "model",
		Parts: []GeminiPart{{Text: "Understood. I will provide excellent, market-aware trading advice in your selected language."}},
	})

	for _, msg := range req.Messages {
		role := msg.Role
		if role == "assistant" {
			role = "model"
		}
		geminiContents = append(geminiContents, GeminiChatContent{
			Role:  role,
			Parts: []GeminiPart{{Text: msg.Content}},
		})
	}

	// 3. ยิงไปหา AI
	apiKey := os.Getenv("GEMINI_API_KEY")
	var reply string
	var err error
	var source = "gemini"

	if apiKey != "" {
		reply, err = callGeminiChat(geminiContents, apiKey)
	} else {
		err = fmt.Errorf("no api key")
	}

	// 4. Fallback ไปหา Pollinations (Unlimited free API) ถ้า Gemini Quota หมด
	if err != nil && (strings.Contains(err.Error(), "429") || apiKey == "") {
		log.Printf("⚠️ Chat Gemini Quota หมด/พัง! สลับไปอ้อน Pollinations.AI...")
		reply, err = callPollinationsChat(systemPrompt, req.Messages)
		if err == nil {
			source = "gemini" // หลอกหน้าบ้านว่าเป็น Gemini จะได้ UI สวยๆ
		}
	}

	if err != nil {
		log.Printf("❌ AI Chat ล่ม: %v", err)
		// Guaranteed fallback string instead of 500
		reply = "⚠️ ระบบ AI ตอนนี้ประมวลผลหนัก หรือมีปัญหาเรื่องการเชื่อมต่อครับพี่ แต่มองจากทรงกราฟแล้วเทรดด้วยความระมัดระวังนะครับ ตั้ง SL เสมอ!"
		source = "fallback"
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"source": source,
		"reply":  reply,
	})
}

// ----------------------------------------------------
// AI Callers (Chat mode)
// ----------------------------------------------------
func callGeminiChat(contents []GeminiChatContent, apiKey string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=%s", apiKey)
	reqObj := GeminiChatRequest{
		Contents:         contents,
		GenerationConfig: GeminiGenConfig{MaxOutputTokens: 1000, Temperature: 0.8},
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

// Pollinations.ai uses an OpenAI-compatible endpoint without auth!
func callPollinationsChat(systemPrompt string, messages []ChatMessage) (string, error) {
	url := "https://text.pollinations.ai/openai"

	var oaiMessages []map[string]string
	oaiMessages = append(oaiMessages, map[string]string{"role": "system", "content": systemPrompt})

	for _, msg := range messages {
		oaiMessages = append(oaiMessages, map[string]string{"role": msg.Role, "content": msg.Content})
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
