# 📘 คู่มือสัมภาษณ์งาน MMRRDiKub — ฉบับสมบูรณ์

> **สำหรับ**: เตรียมตัวพรีเซนต์โปรเจคและตอบคำถามสัมภาษณ์ทุกเรื่อง
> **เวอร์ชัน**: 1.0 | **อัปเดต**: มีนาคม 2026
> **อ่านแล้วต้อง**: อธิบายได้ทุกฟังก์ชัน ทุกโลจิก เปิดโค้ดให้ดูได้

---

## 📋 สารบัญ

1. [ภาพรวมโปรเจค (Overview)](#1-ภาพรวมโปรเจค)
2. [โครงสร้างโฟลเดอร์ (Project Structure)](#2-โครงสร้างโฟลเดอร์)
3. [🐳 Docker & Multi-Stage Build](#3-docker--multi-stage-build)
4. [⚡ Go Fiber Backend — ทุกไฟล์ ทุกฟังก์ชัน](#4-go-fiber-backend)
5. [🌐 Next.js Frontend — Components & Logic](#5-nextjs-frontend)
6. [🤖 AI Risk Analyst — RAG Pipeline & Fallback](#6-ai-risk-analyst)
7. [🗄️ Database Design — PostgreSQL & GORM](#7-database-design)
8. [🔐 Security — JWT, bcrypt, Middleware](#8-security)
9. [🚀 Deployment — Render, Vercel, Domain](#9-deployment)
10. [🎤 คำถามสัมภาษณ์จำลอง + คำตอบ](#10-คำถามสัมภาษณ์จำลอง)

---

## 1. ภาพรวมโปรเจค

### มันคืออะไร?
MMRRDiKub = **เครื่องมือเทรด Crypto ระดับ Production** ที่มี 3 ฟีเจอร์หลัก:
1. **Position Size Calculator** — คำนวณขนาด Order แบบ Multi-SL/TP + Fee-Adjusted
2. **Trading Journal** — บันทึกประวัติเทรดพร้อม CRUD เต็มรูปแบบ
3. **AI Risk Analyst** — วิเคราะห์แผนเทรดด้วย AI + ข้อมูล Real-time (RAG)

### Tech Stack ที่ใช้จริง

| ส่วน | เทคโนโลยี | ทำไมถึงเลือก |
|------|-----------|-------------|
| **Frontend** | Next.js 16 (React) + TypeScript | SSR, SEO ดี, Ecosystem ใหญ่ |
| **Styling** | Tailwind CSS v4 | Utility-first, เขียนเร็ว |
| **Backend** | Go 1.24 + Fiber v2 | เร็วกว่า Express 5-10x, Compile เป็น Binary |
| **Database** | PostgreSQL (Neon.tech) | Relational, ACID, ฟรี Cloud |
| **ORM** | GORM v1.25 | Auto-migrate, Query Builder |
| **AI** | Google Gemini API + Pollinations (Backup) | LLM วิเคราะห์เทรด |
| **Auth** | JWT (stateless) + bcrypt | Scalable, ไม่ต้องเก็บ session |
| **Deploy** | Docker (Render.com) + Vercel | Container backend, Edge frontend |
| **API ข้อมูล** | Binance API (ราคา) + CryptoPanic API (ข่าว) | ข้อมูล Real-time |

---

## 2. โครงสร้างโฟลเดอร์

```
mmrrdikub/
├── backend/                    ← ⚡ Go Fiber API Server
│   ├── cmd/api/
│   │   └── main.go             ← Entry Point (ตั้งค่า Server, Routes, Middleware)
│   ├── internal/handlers/
│   │   ├── auth.go             ← Register, Login, JWT Token
│   │   ├── trade.go            ← CRUD Trading Journal
│   │   ├── ai.go               ← AI Risk Analyst + RAG Pipeline
│   │   ├── middleware.go       ← JWT Guard (ตรวจ Token)
│   │   └── forgot_password.go  ← Forgot Password + Email OTP
│   ├── pkg/database/
│   │   └── postgres.go         ← เชื่อม PostgreSQL + Connection Pool
│   ├── Dockerfile              ← Multi-stage Build (เล็ก ~15MB)
│   ├── go.mod                  ← Dependencies ของ Go
│   └── .env                    ← Secrets (ห้าม commit!)
│
├── frontend/                   ← 🌐 Next.js Application
│   ├── app/
│   │   ├── components/
│   │   │   ├── Calculator.tsx  ← Position Size Calculator (อลัง 1000+ บรรทัด)
│   │   │   ├── Dashboard.tsx   ← หน้า Dashboard หลัก
│   │   │   ├── AiChat.tsx      ← AI Chatbot Interface
│   │   │   ├── AIInsights.tsx  ← AI วิเคราะห์พฤติกรรม
│   │   │   ├── Navbar.tsx      ← Navigation Bar
│   │   │   └── PriceTicker.tsx ← ราคา Crypto Real-time
│   │   ├── utils/
│   │   │   └── api.ts          ← Axios Instance + API Functions
│   │   ├── context/
│   │   │   ├── ThemeContext.tsx ← Dark/Light Mode
│   │   │   └── LanguageContext.tsx ← TH/EN
│   │   ├── login/page.tsx      ← หน้า Login
│   │   ├── register/page.tsx   ← หน้าสมัครสมาชิก
│   │   ├── dashboard/page.tsx  ← หน้า Dashboard (Protected)
│   │   ├── layout.tsx          ← Root Layout (Font, Provider)
│   │   └── page.tsx            ← หน้าแรก (Calculator)
│   ├── public/                 ← Static files (favicon, Google verify)
│   ├── postcss.config.mjs      ← Tailwind CSS config
│   ├── next.config.ts          ← Next.js config
│   └── package.json            ← NPM Dependencies
│
└── .gitignore                  ← กัน Secrets หลุด
```

**วิธีอธิบายตอนสัมภาษณ์:**
> "ผมแยกโปรเจคเป็น 2 ส่วนชัดเจนครับ — `backend/` เป็น Go API Server และ `frontend/` เป็น Next.js โดยใช้ **Monorepo** ง่ายๆ ที่ทำงานแยกกันเด็ดขาดผ่าน REST API ทำให้แต่ละฝั่ง Scale ได้อิสระครับ"

---

## 3. 🐳 Docker & Multi-Stage Build

### ไฟล์: `backend/Dockerfile`
Docker คือ **กล่องสำเร็จรูป** ที่เราจะยัดโปรแกรมลงไป โปรแกรมจะทำงานเหมือนกันในทุกเครื่อง ไม่ว่าจะเป็น Mac, Windows, หรือ Server บน Cloud

### Multi-Stage Build คืออะไร?
คิดภาพง่ายๆ เหมือน **โรงงานผลิตรถยนต์**:
- **Stage 1 (Builder)** = โรงงาน — ใหญ่มาก มีเครื่องมือเต็ม (Go Compiler, Git ฯลฯ) ใช้ **ประกอบรถ**
- **Stage 2 (Runtime)** = ถนนจริง — เอาแค่ **ตัวรถ** ที่ประกอบเสร็จไปวิ่ง ไม่ต้องเอาโรงงานทั้งหลังไปด้วย!

### โค้ดจริงพร้อมอธิบาย

```dockerfile
# ╔═══════════════════════════════════════╗
# ║   STAGE 1: BUILD (โรงงานประกอบ)       ║
# ║   Image ขนาด ~1GB (ใหญ่มาก!)        ║
# ╚═══════════════════════════════════════╝

FROM golang:1.24-alpine AS builder
# ↑ ดาวน์โหลด Go Compiler เวอร์ชัน 1.24 บน Alpine Linux (เบา)
# "AS builder" = ตั้งชื่อว่า "builder" เพื่อเรียกใช้ใน Stage 2

RUN apk add --no-cache git
# ↑ ติดตั้ง Git (บาง Go package ต้องใช้ดึงจาก GitHub)

WORKDIR /app
# ↑ สร้างโฟลเดอร์ /app แล้วเข้าไปทำงาน

COPY go.mod go.sum ./
RUN go mod download
# ↑ ⭐ TRICK สำคัญ! ก๊อป go.mod ก่อนแล้ว download dependencies
# ทำไม? เพราะ Docker มี "Layer Caching"
# ถ้า go.mod ไม่เปลี่ยน = Docker จะจำผลลัพธ์เก่าไว้ ไม่ต้อง download ใหม่!
# ประหยัดเวลา Build จาก 5 นาที เหลือ 30 วินาที

COPY . .
# ↑ ก๊อป Source Code ทั้งหมด

RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/
# ↑ Compile Go เป็น Binary ชื่อ "main"
# CGO_ENABLED=0 = ไม่ใช้ C libraries → Binary ทำงานเดี่ยวได้เลย
# GOOS=linux = Build สำหรับ Linux (Server ส่วนใหญ่เป็น Linux)
# ผลลัพธ์: ได้ไฟล์ "main" ตัวเดียว ขนาดแค่ ~15MB!


# ╔═══════════════════════════════════════╗
# ║   STAGE 2: RUNTIME (ส่งตัวรถออกวิ่ง)  ║
# ║   Image ขนาด ~15MB เท่านั้น!          ║
# ╚═══════════════════════════════════════╝

FROM alpine:3.19
# ↑ ใช้ Alpine Linux เปล่าๆ ขนาดแค่ 5MB!
# ไม่มี Go Compiler ไม่มี Git ไม่มีอะไรเลย → ปลอดภัย!

RUN apk --no-cache add ca-certificates tzdata
# ↑ ติดตั้งแค่ 2 อย่าง:
# ca-certificates = ใบรับรอง SSL (ต้องมีถ้าจะเรียก HTTPS เช่น Binance API)
# tzdata = ข้อมูล Timezone (Asia/Bangkok)

ENV TZ=Asia/Bangkok
# ↑ ตั้ง Timezone เป็นกรุงเทพ

# ⭐ SECURITY BEST PRACTICE: สร้าง Non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup
# ↑ สร้าง User "appuser" ที่ไม่ใช่ root
# ทำไม? ถ้า Hacker เจาะเข้ามาได้ จะทำอะไรได้แค่เท่าที่ appuser มีสิทธิ์
# ไม่ใช่ root ที่ทำได้ทุกอย่าง!

WORKDIR /app

COPY --from=builder /app/main .
# ↑ ⭐ หัวใจของ Multi-Stage!
# ก๊อปแค่ไฟล์ Binary "main" จาก Stage 1 (builder)
# ไม่ก๊อป Source Code, ไม่ก๊อป Dependencies, ไม่ก๊อปอะไรอื่น!
# Image สุดท้าย = Alpine (5MB) + Binary (15MB) = ~20MB
# เทียบกับ Stage 1 ที่ 1GB+ → เล็กลง 50 เท่า!

RUN chown -R appuser:appgroup /app
USER appuser
# ↑ เปลี่ยนมาใช้ appuser (ไม่ใช่ root)

EXPOSE 8080
# ↑ เปิดพอร์ต 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
# ↑ ⭐ HEALTH CHECK
# ทุกๆ 30 วินาที Docker จะยิง /health ดูว่า Server ยังอยู่ไหม
# ถ้าไม่ตอบ 3 ครั้งติด → Docker จะ restart Container ให้อัตโนมัติ
# start-period=5s = ให้เวลา Server เริ่มต้น 5 วิก่อนเริ่มเช็ค

CMD ["./main"]
# ↑ สั่ง Run Binary "main" เมื่อ Container เริ่มทำงาน
```

### วิธีตอบคำถามสัมภาษณ์ (พูดง่ายๆ):
> "ผมใช้ Multi-stage Build ครับ Stage แรกเปรียบเหมือนโรงงาน — มี Go Compiler ขนาดกิกกว่าๆ เอาไว้ Compile โค้ดเป็น Binary Stage ที่สอง ผมเอาแค่ตัว Binary ที่ Compile เสร็จแล้ว ไปวางบน Alpine Linux เปล่าๆ ที่ขนาดแค่ 5 MB ผลลัพธ์คือ Image สุดท้ายเล็กมาก แค่ ~20 MB เทียบกับถ้าไม่ทำ จะได้กิกกว่าๆ ครับ

> เรื่อง Security ผมสร้าง Non-root User ชื่อ appuser ไม่ให้ Container รันด้วย root ป้องกันกรณี Hacker เจาะเข้ามาจะทำอะไรได้จำกัด และผมมี Health Check ทุก 30 วินาที ถ้า Server ล่มก็ Restart ให้อัตโนมัติครับ"

---

## 4. ⚡ Go Fiber Backend

### 4.1 Entry Point: `cmd/api/main.go` (192 บรรทัด)

ไฟล์นี้คือ **จุดเริ่มต้นของทุกอย่าง** เมื่อรันคำสั่ง `go run cmd/api/main.go` มันจะทำ 8 ขั้นตอนตามลำดับ:

```
main() ทำอะไรบ้าง:
1. ConnectDB()           → เชื่อมต่อ PostgreSQL (Neon)
2. MigrateAuthModels()   → สร้างตาราง users (ถ้ายังไม่มี)
3. MigrateTradeModels()  → สร้างตาราง trades (ถ้ายังไม่มี)
4. fiber.New()           → สร้าง HTTP Server + ตั้งค่า Timeout
5. Middleware            → Logger, Recover, CORS
6. Routes               → ผูก URL กับ Handler Functions
7. 404 Handler           → จัดการ URL ที่ไม่มี
8. app.Listen(":8080")   → เปิด Server รอรับ Request
```

### Routes ทั้งหมด (สำคัญ! ต้องจำ):

```
PUBLIC (ไม่ต้อง Login):
  POST /api/register                        → สมัครสมาชิก
  POST /api/login                           → เข้าสู่ระบบ → ได้ JWT Token
  POST /api/auth/forgot-password/request    → ขอ OTP ทางอีเมล
  POST /api/auth/forgot-password/verify     → ยืนยัน OTP
  POST /api/auth/forgot-password/reset      → ตั้งรหัสผ่านใหม่

PROTECTED (ต้องมี JWT Token):
  POST   /api/trades       → สร้างบันทึกเทรดใหม่
  GET    /api/trades        → ดูประวัติเทรดทั้งหมด (มี Filter)
  GET    /api/trades/:id    → ดูเทรดไม้เดียว
  PUT    /api/trades/:id    → อัปเดตเทรด (ปิด Order)
  DELETE /api/trades/:id    → ลบเทรด (Soft Delete)

  POST   /api/ai/analyze   → AI วิเคราะห์แผนเทรด
  POST   /api/ai/chat      → Chatbot AI
  GET    /api/ai/insights   → AI วิเคราะห์พฤติกรรม
```

### CORS (Cross-Origin Resource Sharing):
```go
AllowOriginsFunc: func(origin string) bool {
    // localhost:3000 → อนุญาต (Development)
    // *.vercel.app   → อนุญาต (Production)
    // *.xyz          → อนุญาต (Custom Domain)
}
```
**ทำไมต้องมี:** เพราะ Frontend (port 3000) กับ Backend (port 8080) อยู่คนละ Domain → Browser จะบล็อคถ้าไม่ตั้ง CORS

---

### 4.2 Database Connection: `pkg/database/postgres.go` (70 บรรทัด)

```go
var DB *gorm.DB  // ← ตัวแปร Global ให้ไฟล์อื่นเรียกใช้

func ConnectDB() {
    // 1. อ่าน DB_URL จาก .env
    dsn := os.Getenv("DB_URL")

    // 2. เชื่อมต่อ PostgreSQL ผ่าน GORM
    db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger:      logger.Default.LogMode(logger.Warn),
        PrepareStmt: false,
    })

    // 3. ⭐ Connection Pool — สำคัญมากสำหรับ Production!
    sqlDB.SetMaxIdleConns(5)                   // Connection เปล่าเก็บไว้ 5 ตัว
    sqlDB.SetMaxOpenConns(20)                  // เปิดได้สูงสุด 20 พร้อมกัน
    sqlDB.SetConnMaxLifetime(30 * time.Minute) // อายุ Connection สูงสุด 30 นาที
    sqlDB.SetConnMaxIdleTime(10 * time.Minute) // ว่างเกิน 10 นาที → ปิดทิ้ง

    // 4. Ping ทดสอบว่าเชื่อมได้จริง
    sqlDB.Ping()
}
```

**วิธีอธิบายสัมภาษณ์:**
> "ผมใช้ Connection Pool ครับ แทนที่จะเปิด-ปิด Connection ทุกครั้ง ซึ่งเปลืองมาก ผมเก็บ Pool ไว้ 5-20 ตัว เมื่อมี Request เข้ามาก็หยิบไปใช้ เสร็จแล้วคืน ไม่ต้องเปิดใหม่ ถ้า Connection ว่างเกิน 10 นาที ก็ปิดอัตโนมัติเพื่อไม่กิน Resource ครับ"

---

### 4.3 Auth Handler: `internal/handlers/auth.go` (270 บรรทัด)

#### User Model (GORM จะสร้างตาราง "users" ให้อัตโนมัติ):
```go
type User struct {
    ID                uint           // Primary Key (Auto Increment)
    Username          string         `gorm:"uniqueIndex;size:100"`
    Email             string         `gorm:"uniqueIndex;size:255"`
    Password          string         // เก็บ bcrypt Hash (ไม่ใช่ Password จริง!)
    ResetOTP          *string        // OTP สำหรับ Forgot Password
    ResetOTPExpiresAt *time.Time     // OTP หมดอายุเมื่อไหร่
    CreatedAt         time.Time
    UpdatedAt         time.Time
    DeletedAt         gorm.DeletedAt `gorm:"index"` // ⭐ Soft Delete!
}
```

#### Register Flow:
```
ผู้ใช้กรอก username, email, password
    ↓
1. BodyParser → แกะ JSON จาก Request Body
2. เช็ค username ซ้ำไหม? (SELECT * FROM users WHERE username = ?)
3. เช็ค email ซ้ำไหม?
4. ⭐ bcrypt.GenerateFromPassword(password, cost=12) → Hash รหัสผ่าน
   ตัวอย่าง: "mypassword123" → "$2a$12$LJ3m4aV..."
   (cost=12 หมายความว่า Hash 1 ครั้งใช้เวลา ~250ms → โจมตี Brute Force ยาก!)
5. DB.Create(&user) → บันทึกลง Database
6. Response: { "message": "สมัครสมาชิกสำเร็จ" }
```

#### Login Flow:
```
ผู้ใช้กรอก username, password
    ↓
1. SELECT * FROM users WHERE username = ? → หา User
2. ⭐ bcrypt.CompareHashAndPassword(hash, password) → เปรียบเทียบ
   ระบบเอา password ที่ส่งมา Hash ใหม่ แล้วเทียบกับ Hash ที่เก็บไว้ใน DB
   → ตรงกัน = รหัสถูก | ไม่ตรง = รหัสผิด
3. สร้าง JWT Token:
   - UserID + Username ใส่ใน Payload (Claims)
   - เซ็นด้วย JWT_SECRET (HMAC-SHA256)
   - หมดอายุ 24 ชั่วโมง
4. Response: { "token": "eyJhbGciOiJIUzI1...", "expires_at": 1709..., "user": {...} }
```

**JWT Token มีอะไรข้างใน:**
```json
// Header
{ "alg": "HS256" }

// Payload (Claims) — ข้อมูลที่เราใส่
{
  "user_id": 1,
  "username": "boss123",
  "exp": 1709251200    // หมดอายุเมื่อไหร่ (Unix timestamp)
}

// Signature — ลายเซ็นดิจิทัล
HMAC-SHA256(header + payload, JWT_SECRET)
```

---

### 4.4 Middleware (JWT Guard): `internal/handlers/middleware.go` (70 บรรทัด)

```go
func JWTMiddleware(c *fiber.Ctx) error {
    // 1. ดึง Header "Authorization: Bearer <token>"
    authHeader := c.Get("Authorization")

    // 2. แยก "Bearer" กับ "<token>" ออกจากกัน
    parts := strings.Split(authHeader, " ")

    // 3. Parse และ Verify Token
    claims, err := GetUserFromToken(parts[1])
    // → เช็ค Signature ตรงไหม? หมดอายุยัง?

    // 4. ⭐ ถ้าผ่าน → ใส่ข้อมูล User ลงใน Context
    c.Locals("userID", claims.UserID)
    c.Locals("username", claims.Username)

    // 5. ส่งต่อไปให้ Handler จริง
    return c.Next()
}
```

**Flow ที่เกิดขึ้นจริง:**
```
Frontend ยิง POST /api/trades
    ↓
Request มี Header "Authorization: Bearer eyJhbG..."
    ↓
JWTMiddleware() ตรวจสอบ:
  ✓ มี Header → ✓ Format ถูก → ✓ Token ยังไม่หมดอายุ → ✓ Signature ถูก
    ↓
ใส่ userID ลง Context → ส่งต่อไป CreateTrade()
    ↓
CreateTrade() เรียก GetCurrentUserID(c) → ได้ userID = 1
    ↓
สร้างเทรดสำหรับ user_id = 1 (ไม่มีทาง Access ข้อมูลคนอื่น!)
```

---

### 4.5 Trade Handler: `internal/handlers/trade.go` (505 บรรทัด)

#### Trade Model:
```go
type Trade struct {
    ID            uint      // Primary Key
    UserID        uint      // ⭐ Foreign Key → users.id
    Pair          string    // เช่น "BTC/USDT"
    Side          string    // "LONG" หรือ "SHORT"
    EntryPrice    float64   // ราคาเข้า
    ExitPrice     float64   // ราคาออก
    StopLoss      float64   // จุด SL
    TakeProfit    float64   // จุด TP
    PositionSize  float64   // ขนาด Position ($)
    Quantity      float64   // จำนวนเหรียญ
    Leverage      int       // เลเวอเรจ
    RiskPercent   float64   // % ความเสี่ยง
    MaxWin        float64   // กำไรสูงสุด ($)
    MaxLoss       float64   // ขาดทุนสูงสุด ($)
    RiskRewardRatio float64 // Risk:Reward Ratio
    Fee           float64   // ค่าธรรมเนียม
    EntryReason   string    // เหตุผลที่เข้า
    SetupScore    int       // 1-5 ดาว (AI คำนวณ)
    PnL           float64   // กำไร/ขาดทุน
    PnLPercent    float64   // PnL %
    Status        string    // OPEN, WIN, LOSS, BREAK_EVEN
    Notes         string    // บันทึก
    Tags          string    // แท็ก
    DeletedAt     gorm.DeletedAt // ⭐ Soft Delete
}
```

#### ⭐ calculateSetupScore() — คำนวณดาวอัตโนมัติ:
```go
func calculateSetupScore(rr float64, riskPercent float64) int {
    score := 3  // เริ่มต้น 3 ดาว

    // ยิ่ง RR สูง ยิ่งดี
    if rr > 3 { score = 5 }        // RR > 3 = 5 ดาว (สุดยอด!)
    else if rr > 2 { score = 4 }   // RR > 2 = 4 ดาว
    else if rr > 1.5 { score = 3 } // RR > 1.5 = 3 ดาว

    // แต่ถ้าเสี่ยงเยอะ หัก!
    if riskPercent > 10 { score -= 2 }     // Risk > 10% → หัก 2 ดาว
    else if riskPercent > 5 { score -= 1 } // Risk > 5% → หัก 1 ดาว

    return max(1, min(5, score))  // ผลลัพธ์ 1-5 ดาว
}
```

#### GetTrades() — ดึงประวัติพร้อม Filter + Stats:
```
GET /api/trades?status=WIN&pair=BTC&limit=10&sort_by=pnl&sort_dir=desc
    ↓
1. WHERE user_id = ? (ดึงแค่ของตัวเอง)
2. AND status = 'WIN' (Filter ตามสถานะ)
3. AND pair LIKE '%BTC%' (Filter ตามเหรียญ)
4. ORDER BY pnl DESC (เรียงตาม PnL มากไปน้อย)
5. LIMIT 10 OFFSET 0 (เอาแค่ 10 รายการ)
6. คำนวณ Stats: {total_pnl, win_count, loss_count, avg_rr}
```

#### Soft Delete คืออะไร:
```
ปกติ DELETE → ลบข้อมูลจาก Database ถาวร (กู้คืนไม่ได้!)

Soft Delete → ไม่ได้ลบจริง! แค่ใส่วันที่ลงช่อง deleted_at
ข้อมูลยังอยู่ใน Database แต่ GORM จะไม่ดึงมาแสดง

ตัวอย่าง:
  id=1, pair="BTC", deleted_at=NULL       → แสดงปกติ
  id=2, pair="ETH", deleted_at="2026-03-01" → ไม่แสดง (เหมือนลบแล้ว)

ข้อดี: ถ้าลบผิด สามารถกู้คืนได้!
วิธีกู้: UPDATE trades SET deleted_at = NULL WHERE id = 2
```

---

## 5. 🌐 Next.js Frontend

### 5.1 API Layer: `app/utils/api.ts` (279 บรรทัด)

```typescript
// ตั้งค่า Base URL — ดูจาก Environment Variable ก่อน
const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
// Production: NEXT_PUBLIC_API_URL = https://mmrrdikub.onrender.com
// Development: ไม่ตั้ง → ใช้ localhost:8080

const api = axios.create({
    baseURL: API_BASE_URL,    // เช่น http://localhost:8080/api
    timeout: 60000,           // 60 วินาที (AI อาจใช้เวลา 30 วิ)
    withCredentials: true,    // ส่ง Cookie/Credentials ได้
});

// ⭐ Request Interceptor — ยัด JWT Token ให้ทุก Request อัตโนมัติ
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ⭐ Response Interceptor — จัดการ Error กลาง
api.interceptors.response.use(
    (response) => response,  // สำเร็จ → ส่งต่อ
    (error) => {
        if (error.response?.status === 401) {
            // Token หมดอายุ → ล้าง Token → Redirect ไป Login
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);
```

### 5.2 Components หลัก

| Component | Lines | หน้าที่ |
|-----------|-------|--------|
| `Calculator.tsx` | 1000+ | Position Size Calculator หลัก, Multi-SL/TP, Fee-Adjusted |
| `Dashboard.tsx` | ~500 | หน้า Dashboard, แสดง Trade History, Stats |
| `AiChat.tsx` | ~200 | UI Chatbot คุยกับ AI |
| `AIInsights.tsx` | ~150 | แสดง AI วิเคราะห์พฤติกรรมเทรด |
| `PriceTicker.tsx` | ~100 | ราคา Crypto Real-time จาก Binance WebSocket |
| `Navbar.tsx` | ~100 | Navigation + Theme Toggle + Language Switch |

### 5.3 Layout: `app/layout.tsx`
```tsx
// Root Layout ครอบทุกหน้า
<html lang="th" className="dark">
  <body className={`${inter.variable} ${kanit.variable}`}>
    <LanguageProvider>   {/* ภาษา TH/EN */}
      <ThemeProvider>     {/* Dark/Light Mode */}
        {children}        {/* หน้าเว็บจริง */}
      </ThemeProvider>
    </LanguageProvider>
  </body>
</html>
```

---

## 6. 🤖 AI Risk Analyst — RAG Pipeline

### RAG คืออะไร?
RAG = **Retrieval-Augmented Generation**
แปลเป็นภาษาบ้านๆ = "ดึงข้อมูลจริงมาป้อน AI ก่อน แล้วค่อยให้ AI วิเคราะห์"

**ถ้าไม่มี RAG:** AI จะมั่วตอบจากความรู้เก่าๆ (Training Data) เช่น บอกราคา BTC = $28,000 (ข้อมูลปี 2023!)
**มี RAG:** เราป้อนราคาจริง $97,000 ให้มัน → ตอบถูก!

### Flow ทั้งหมดเมื่อ User กด "วิเคราะห์":

```
User กดปุ่ม "ส่งให้ AI วิเคราะห์" บน Frontend
    ↓
POST /api/ai/analyze { coin: "BTC/USDT", entry: 97000, sl: 95000, tp: 100000, side: "LONG" }
    ↓
[JWTMiddleware] → ตรวจ Token → ได้ userID
    ↓
[AnalyzeTrade Handler] ทำ 5 ขั้นตอน:

  ① ดึงประวัติเทรดเก่าของ User คนนี้ (จาก PostgreSQL)
     → SELECT * FROM trades WHERE user_id=1 AND pair LIKE '%BTC%' ORDER BY created_at DESC LIMIT 5

  ② คำนวณ Risk:Reward Ratio
     → RR = (TP - Entry) / (Entry - SL) = (100000 - 97000) / (97000 - 95000) = 1.5

  ③ ⭐ ดึงข่าว Crypto Real-time (RAG!)
     → fetchCryptoNews("BTC") → เรียก CryptoPanic API → Cache 24 ชม.

  ④ ⭐ ดึงราคาปัจจุบัน (RAG!)
     → fetchLivePrice("BTC") → เรียก Binance API → Cache 1 นาที

  ⑤ รวมทุกอย่างเป็น Prompt ส่ง AI:
     "คุณคือ AI Risk Manager...
      เหรียญ BTC/USDT ฝั่ง LONG: เข้า 97000, SL 95000, TP 100000
      💰 ราคาตลาดปัจจุบัน: $97,150 USD
      ประวัติ: ไม้1: WIN PnL=500, ไม้2: LOSS PnL=-200
      ข่าวร้อนแรง:
      - Bitcoin ETF sees record inflows
      - Fed signals rate pause
      ..."
    ↓
[3-Tier Fallback System]:

  ลำดับ 1: Gemini API (Google)
    → ถ้าได้คำตอบ → ส่งกลับ ✅
    → ถ้า 429 Quota Exceeded → ไปลำดับ 2

  ลำดับ 2: Pollinations AI (Backup ฟรี)
    → ถ้าได้คำตอบ → ลบโฆษณาทิ้ง → ส่งกลับ ✅
    → ถ้าล่มอีก → ไปลำดับ 3

  ลำดับ 3: Rule-based Fallback
    → ใช้ Logic พื้นฐาน คำนวณ RR แล้วตอบกลับ
    → เว็บไม่มีทางหน้าขาว 100%!
```

### Caching System — ทำไมถึงต้องมี:

```
fetchCryptoNews() — Cache 24 ชั่วโมง
├── เหตุผล: CryptoPanic API ฟรีให้แค่ 100 ครั้ง/เดือน
├── ถ้าไม่ cache: User 20 คนกดวันละ 5 ครั้ง = 100 ครั้ง/วัน → หมดโควต้าวันเดียว!
├── มี cache: ข่าว BTC ถูกเก็บใน RAM → User 1000 คนใช้ก็ยิง API แค่ครั้งเดียว/24ชม.
└── ใช้ sync.Mutex ป้องกัน Race Condition (หลาย Request เข้าพร้อมกัน)

fetchLivePrice() — Cache 1 นาที
├── เหตุผล: ราคาเปลี่ยนเร็ว ต้อง Refresh บ่อย แต่ยิงทุก Request ก็เยอะไป
├── 1 นาทีเหมาะสม: ราคาอัปเดตทัน + ไม่โดน Binance แบน
└── เก็บ price + timestamp ใน map (O(1) lookup)
```

**วิธีอธิบาย Caching ตอนสัมภาษณ์:**
> "ผมใช้ In-Memory Cache ครับ เก็บผลลัพธ์ไว้ใน RAM ของ Server ข่าว Cache 24 ชม. เพราะ API ฟรีมีโควต้าจำกัด ส่วนราคา Cache 1 นาที เพราะต้องอัปเดตบ่อยกว่า ผมใช้ sync.Mutex ล็อคการเข้าถึง Map เพื่อป้องกัน Race Condition เมื่อหลาย Request เข้ามาพร้อมกันครับ"

---

## 7. 🗄️ Database Design

### ตาราง users:
```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,  -- bcrypt Hash
    reset_otp   VARCHAR(10),           -- OTP สำหรับ Forgot Password
    reset_otp_expires_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    deleted_at  TIMESTAMP              -- Soft Delete
);
```

### ตาราง trades:
```sql
CREATE TABLE trades (
    id               SERIAL PRIMARY KEY,
    user_id          INT REFERENCES users(id),  -- ⭐ Foreign Key!
    pair             VARCHAR(20) NOT NULL,       -- "BTC/USDT"
    side             VARCHAR(10) NOT NULL,       -- "LONG" / "SHORT"
    entry_price      DECIMAL(24,8),              -- ⭐ DECIMAL ไม่ใช่ FLOAT!
    exit_price       DECIMAL(24,8),
    stop_loss        DECIMAL(24,8),
    take_profit      DECIMAL(24,8),
    position_size    DECIMAL(24,8),
    quantity         DECIMAL(24,8),
    leverage         INT DEFAULT 1,
    risk_percent     DECIMAL(10,4),
    max_win          DECIMAL(24,8),
    max_loss         DECIMAL(24,8),
    risk_reward_ratio DECIMAL(10,4),
    fee              DECIMAL(24,8),
    entry_reason     TEXT,
    setup_score      INT,                       -- 1-5 ดาว
    pnl              DECIMAL(24,8),
    pnl_percent      DECIMAL(10,4),
    status           VARCHAR(20) DEFAULT 'OPEN', -- OPEN, WIN, LOSS, BREAK_EVEN
    notes            TEXT,
    tags             VARCHAR(500),
    deleted_at       TIMESTAMP,                  -- Soft Delete
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
```

### ⭐ ทำไมใช้ DECIMAL(24,8) ไม่ใช่ FLOAT?

```
FLOAT มีปัญหา "ทศนิยมเพี้ยน" ในระบบการเงิน:
  0.1 + 0.2 = 0.30000000000000004 (ไม่ใช่ 0.3!)

DECIMAL(24,8) แก้ปัญหานี้:
  24 = ตัวเลขทั้งหมดสูงสุด 24 หลัก
  8  = ทศนิยม 8 ตำแหน่ง
  0.1 + 0.2 = 0.30000000 (เป๊ะ!)

ทำไม 24 หลัก? เพราะ Crypto มีค่า:
  BTC  = $97,000.00000000 (ต้องรองรับราคาสูง)
  SHIB = $0.00002345     (ต้องรองรับทศนิยมเยอะ)
```

### ON DELETE CASCADE (ตอบคำถามสัมภาษณ์):

**คำถาม:** "ลบเทรดแล้ว TP/SL ค้างไหม?"

**คำตอบ:**
> "ในโปรเจคผมตอนนี้ TP/SL เก็บเป็นฟิลด์เดียวในตาราง trades เลยครับ เพราะ GORM จะ Soft Delete ทั้งแถว ข้อมูลไม่หายจริงแค่ใส่ deleted_at

> แต่ถ้าจะแยกตาราง sl_levels และ tp_levels แบบ One-to-Many ในอนาคต ผมจะใช้ ON DELETE CASCADE ครับ คือเมื่อลบ Trade หลัก ข้อมูลในตารางลูกจะถูกลบตามไปด้วยอัตโนมัติ ไม่เกิดขยะใน Database

> ใน GORM จะเขียนว่า `gorm:\"constraint:OnDelete:CASCADE\"` ใน Struct Tag ครับ"

---

## 8. 🔐 Security

### 8.1 bcrypt Password Hashing

```
ผู้ใช้ตั้งรหัส: "mypassword123"
    ↓
bcrypt.GenerateFromPassword("mypassword123", cost=12)
    ↓
เก็บในDB: "$2a$12$LJ3m4aV..."
    ↓
ตอน Login: bcrypt.CompareHashAndPassword("$2a$12$LJ3m4aV...", "mypassword123")
    → ✅ ตรงกัน!

ทำไม cost=12?
  cost=10 → Hash ใช้เวลา ~60ms  (เร็วไป Hacker brute force ได้)
  cost=12 → Hash ใช้เวลา ~250ms (ช้าพอดี ปลอดภัย!)
  cost=14 → Hash ใช้เวลา ~1s    (ช้าเกิน User รอนาน)
```

### 8.2 JWT Stateless Authentication

```
Stateless แปลว่า:
  Server ไม่ต้องเก็บ Session ไว้ที่ไหนเลย!
  Token มีข้อมูลครบในตัวเอง (user_id, username, expiry)
  แค่เช็ค Signature ว่าถูกต้อง = รู้ว่าเป็นใคร

  ข้อดี: Scale ได้ง่าย มี 10 Server ก็ไม่ต้อง Share Session
  ข้อเสีย: เพิกถอน Token ยาก (ต้องรอหมดอายุ)
```

### 8.3 Non-root Docker User

```
ถ้า Container รัน root:
  Hacker เจาะได้ → สิทธิ์ root → ทำอะไรก็ได้ → แฮ็ค Server ทั้งลูก

ถ้า Container รัน appuser:
  Hacker เจาะได้ → สิทธิ์ appuser → ทำได้แค่ใน /app → ทำร้ายไม่ได้มาก
```

---

## 9. 🚀 Deployment

```
Architecture บน Production:

  ผู้ใช้ → https://mmrrdikub.xyz
          ↓
  Vercel (CDN Edge) ← Frontend (Next.js)
          ↓ API calls
  Render.com ← Backend (Docker Container = Go Binary)
          ↓ SQL queries
  Neon.tech ← PostgreSQL Database (Cloud)

  APIs:
  ├── Binance (ราคา Crypto Real-time)
  ├── CryptoPanic (ข่าว Crypto)
  └── Google Gemini (AI วิเคราะห์)
```

### Environment Variables บน Render:
```
DB_URL=postgresql://user:pass@neon.tech/mmrrdikub
GEMINI_API_KEY=AIza...
JWT_SECRET=super_secret_key_never_commit_this
CRYPTOPANIC_API_KEY=xxx
PORT=8080
```

---

## 10. 🎤 คำถามสัมภาษณ์จำลอง + คำตอบ

### Q1: Docker Multi-Stage Build ทำงานยังไง?
> "Stage แรกเปรียบเหมือนโรงงาน มี Go Compiler ขนาดกิกกว่า Compile โค้ดเป็น Binary ตัวเดียว ~15MB Stage ที่สอง เอาแค่ Binary ไปวางบน Alpine เปล่าๆ ผลคือ Image สุดท้ายเล็กมาก ปลอดภัยเพราะไม่มี tools ให้ Hacker ใช้ แถมรันด้วย Non-root user ครับ"

### Q2: ลบ Trade แล้ว TP/SL ค้างไหม?
> "ผมใช้ Soft Delete ครับ ข้อมูลไม่ถูกลบจริง แค่ใส่ deleted_at ให้ GORM มองข้าม ถ้าแยกตารางแบบ One-to-Many ในอนาคต จะใช้ ON DELETE CASCADE ให้ลบตามอัตโนมัติ หรือ Soft Delete ทั้ง 3 ตารางไปพร้อมกันก็ได้ครับ"

### Q3: RAG Pipeline ทำงานยังไง?
> "RAG คือการดึงข้อมูลจริงมาป้อน AI ก่อน ผมดึง 3 อย่าง: ประวัติเทรดจาก Postgres, ราคาปัจจุบันจาก Binance API, และข่าว Crypto จาก CryptoPanic รวมทุกอย่างเป็น Prompt ส่งให้ Gemini ทำให้ AI วิเคราะห์จากข้อมูลจริง ไม่มั่วครับ"

### Q4: ถ้า AI API ล่มจะทำยังไง?
> "ผมทำ 3-Tier Fallback ครับ ลำดับ 1 ลอง Gemini ถ้าโควต้าเต็ม ลำดับ 2 สลับไป Pollinations AI อัตโนมัติ ถ้าล่มอีก ลำดับ 3 ใช้ Rule-based คำนวณ RR แล้วตอบกลับ เว็บจะไม่มีทางหน้าขาวเจ๊ง 100% ครับ"

### Q5: Connection Pool คืออะไร? ทำไมต้องมี?
> "แทนที่จะเปิดปิด DB Connection ทุกครั้ง ซึ่งเปลือง ผมเก็บ Pool ไว้ 5-20 ตัว Request เข้ามาหยิบไปใช้ เสร็จแล้วคืน ว่างเกิน 10 นาทีปิดทิ้ง ถ้าไม่มี Pool Request 100 พร้อมกัน = เปิด 100 Connection = Database กระอัก ครับ"

### Q6: ทำไมใช้ DECIMAL ไม่ใช่ FLOAT?
> "FLOAT มีปัญหาทศนิยมเพี้ยนครับ 0.1 + 0.2 = 0.30000...004 ในระบบการเงินผิดแม้แต่สตางค์เดียวก็ยอมรับไม่ได้ DECIMAL(24,8) เก็บค่าเป๊ะ 8 ทศนิยม รองรับทั้ง BTC ราคาหมื่นดอลลาร์ และ SHIB ที่ทศนิยมหลายตำแหน่งครับ"

### Q7: JWT Stateless ต่างจาก Session ยังไง?
> "Session ต้องเก็บข้อมูลไว้ที่ Server ถ้ามี 10 Server ต้อง Share Session Store ยุ่งยาก JWT Stateless ไม่ต้องเก็บอะไรที่ Server เลย Token มีข้อมูลครบในตัว แค่เช็ค Signature ก็รู้ว่าเป็นใคร Scale ได้ง่ายมากครับ"

### Q8: CORS คืออะไร? ทำไมต้องตั้ง?
> "CORS ป้องกันไม่ให้เว็บอื่นยิง API ของเรา เพราะ Frontend อยู่ port 3000 Backend อยู่ port 8080 ถือว่าคนละ Origin ผมเลยตั้ง CORS ให้อนุญาตเฉพาะ localhost:3000, *.vercel.app, และ *.xyz ครับ เว็บอื่นยิงมาจะโดนบล็อค"

### Q9: Middleware ทำหน้าที่อะไร?
> "Middleware เปรียบเหมือนด่านตรวจก่อนเข้าบ้าน ทุก Request ที่ไป /api/trades หรือ /api/ai ต้องผ่าน JWTMiddleware ก่อน มันจะเช็คว่ามี Token ไหม? ถูกต้องไหม? หมดอายุยัง? ถ้าผ่าน ใส่ userID ลง Context แล้วส่งต่อไป Handler จริง ถ้าไม่ผ่านก็ Return 401 กลับไปเลยครับ"

### Q10: Cache ใน AI ทำงานยังไง?
> "ผมใช้ In-Memory Cache เก็บใน Go map ครับ ข่าว Cache 24 ชั่วโมง เพราะ CryptoPanic ฟรีให้ 100 ครั้ง/เดือน ราคา Cache 1 นาที เพราะต้องอัปเดตบ่อย ใช้ sync.Mutex ล็อค Map ป้องกัน Race Condition เมื่อหลาย Request เข้าพร้อมกัน ไม่ใช้ Redis เพราะไม่คุ้มกับสเกลโปรเจคนี้ครับ"

---

## 🧠 สรุปท้าย — จุดเด่นที่ต้องจำ

| หัวข้อ | จุดเด่น |
|--------|---------|
| **Docker** | Multi-stage Build (จาก 1GB เหลือ ~20MB) + Non-root + Health Check |
| **Backend** | Go Fiber (เร็วกว่า Express 5-10x) + Connection Pool |
| **Security** | bcrypt (cost=12) + JWT Stateless + Non-root Docker |
| **AI** | RAG Pipeline (Real-time data) + 3-Tier Fallback (ไม่ล่มเด็ดขาด) |
| **Database** | DECIMAL(24,8) กันทศนิยมเพี้ยน + Soft Delete กันลบผิด |
| **Caching** | In-Memory Cache + sync.Mutex กัน Race Condition |
| **CORS** | Dynamic Origin check (รองรับทั้ง Dev + Production) |

> **เปิดโค้ดให้ดูได้:** ทุกฟังก์ชัน ทุก Logic ที่เขียนไว้ในไฟล์นี้ สามารถเปิดไฟล์จริงใน VSCode ชี้ให้กรรมการดูได้ทันที!
