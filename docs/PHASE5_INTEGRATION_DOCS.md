# 🔐 Phase 5: เชื่อมต่อและประวัติ (Integration)
## MMRRDiKub Trading Journal - Backend-Frontend Integration Deep Dive

**🗓️ วันที่สร้าง:** 2026-02-01  
**📦 Backend:** Go (Golang) + Fiber + GORM + PostgreSQL  
**🔗 Frontend:** Next.js + Axios  
**🎯 เป้าหมาย:** Frontend คุยกับ Backend, Login ได้, ดูประวัติได้

---

# ⚠️ สรุป Errors ทั้งหมดที่เจอและแก้ไข

> [!IMPORTANT]
> Phase 5 เป็น Phase ที่เจอ Error มากที่สุด เพราะต้องเชื่อมต่อหลายส่วนเข้าด้วยกัน

## 📋 Error List ทั้งหมด

| # | Error | สาเหตุ | วิธีแก้ | ไฟล์ที่เกี่ยวข้อง |
|---|-------|--------|--------|------------------|
| 1 | CORS Error | Frontend ไม่ได้รับอนุญาตให้เรียก Backend | เพิ่ม CORS Middleware | `main.go` |
| 2 | 401 Unauthorized | Token ไม่ถูกส่งไปกับ Request | แก้ Axios Interceptor | `api.ts` |
| 3 | Login Failed | Password เทียบไม่ถูก | แก้ bcrypt.CompareHashAndPassword | `auth.go` |
| 4 | Register Duplicate | ไม่ได้เช็ค Username ซ้ำ | เพิ่ม WHERE clause | `auth.go` |
| 5 | Database Column Mismatch | GORM column name ไม่ตรงกับ schema | เพิ่ม gorm tag | `auth.go`, `trade.go` |
| 6 | Trade Save Failed | ไม่มี opened_at/closed_at | เพิ่ม SQL Migration | `add_missing_columns.sql` |
| 7 | Pair Too Long | VARCHAR(20) ไม่พอ | แก้เป็น VARCHAR(50) | `schema.sql`, `trade.go` |
| 8 | Network Error | Backend Listen แค่ localhost | เปลี่ยนเป็น 0.0.0.0 | `main.go` |
| 9 | JWT Expired | Token หมดอายุแต่ไม่ Clear | เพิ่ม 401 Handler | `api.ts` |
| 10 | Multi TP/SL | ไม่รองรับหลายไม้ | เพิ่ม Interface + Calculation | `Calculator.tsx`, `tradeCalculations.ts` |

---

# 🏗️ โครงสร้างไฟล์ Backend (File Structure)

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # 🚀 Entry Point - เปิด Server, ตั้ง Routes
│
├── internal/
│   ├── handlers/                # 📑 HTTP Handlers
│   │   ├── auth.go              # 🔐 Register + Login + JWT
│   │   ├── trade.go             # 📊 CRUD Trades
│   │   ├── middleware.go        # 🛡️ JWT Middleware
│   │   └── handlers.go          # 📦 Package exports
│   │
│   ├── models/                  # 📦 Data Models (ถ้ามี)
│   └── services/                # 🔧 Business Logic (ถ้ามี)
│
├── pkg/
│   └── database/
│       └── postgres.go          # 🗄️ Database Connection
│
├── .env                         # 🔑 Environment Variables
├── go.mod                       # 📦 Go Modules
├── go.sum                       # 🔒 Dependencies Lock
└── api.exe                      # 🎯 Compiled Binary
```

---

# 📄 ไฟล์ Backend แต่ละไฟล์อธิบายละเอียด

---

## 🚀 1. `main.go` - Entry Point (159 บรรทัด)
**ตำแหน่ง:** `backend/cmd/api/main.go`  
**หน้าที่:** จุดเริ่มต้นของโปรแกรม, ตั้งค่า Server, กำหนด Routes

### 📊 โครงสร้าง 8 ส่วนหลัก:

```go
func main() {
    // ส่วนที่ 1: เชื่อมต่อ Database
    // ส่วนที่ 2: Migrate Tables
    // ส่วนที่ 3: สร้าง Fiber App
    // ส่วนที่ 4: Middlewares (CORS, Logger, Recover)
    // ส่วนที่ 5: Health Check Routes
    // ส่วนที่ 6: API Routes
    // ส่วนที่ 7: 404 Handler
    // ส่วนที่ 8: เปิด Server
}
```

### 🔥 Error Fix #1: CORS Configuration

> [!CAUTION]
> **ปัญหา:** Frontend เรียก Backend แล้วโดน CORS Block  
> **อาการ:** Console แสดง `Access to XMLHttpRequest at 'http://localhost:8080' from origin 'http://localhost:3000' has been blocked by CORS policy`

**สาเหตุ:**
- Browser มี Security Policy ที่ห้าม JavaScript เรียก API ต่าง Origin
- Frontend (Port 3000) ≠ Backend (Port 8080) = Cross-Origin

**วิธีแก้:**
```go
// 🔥 FIX: CORS Middleware - สำคัญที่สุด!
app.Use(cors.New(cors.Config{
    // อนุญาต Frontend ที่รันบน Port 3000
    AllowOriginsFunc: func(origin string) bool {
        return origin == "http://localhost:3000" ||
               origin == "http://127.0.0.1:3000" ||
               origin == "http://localhost:3001" ||
               origin == ""  // Allow curl/Postman
    },

    // Methods ที่อนุญาต
    AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",

    // Headers ที่อนุญาต (Authorization สำหรับ JWT)
    AllowHeaders: "Origin,Content-Type,Accept,Authorization",

    // 🔥 สำคัญ! ต้อง true เพื่อให้ส่ง Cookies/Credentials
    AllowCredentials: true,

    // Cache Preflight Request 1 ชั่วโมง
    MaxAge: 3600,
}))
```

**คำอธิบาย Keyword:**
| Keyword | คำอธิบาย |
|---------|----------|
| `AllowOriginsFunc` | Function ตรวจสอบ Origin ที่อนุญาต |
| `AllowMethods` | HTTP Methods ที่อนุญาต |
| `AllowHeaders` | HTTP Headers ที่อนุญาต |
| `AllowCredentials` | อนุญาตส่ง Cookies/Token |
| `MaxAge` | Cache ผล Preflight (วินาที) |
| `Preflight` | OPTIONS Request ที่ Browser ส่งก่อน |

### 🔥 Error Fix #2: Logger Middleware

**ปัญหา:** ไม่รู้ว่า Request มาถึง Backend หรือยัง

**วิธีแก้:**
```go
// 🔥 FIX: Logger - Log ทุก Request
app.Use(logger.New(logger.Config{
    Format:     "📥 [${time}] ${status} | ${method} ${path} | ${latency} | ${ip}\n",
    TimeFormat: "15:04:05",
}))
```

**ผลลัพธ์ใน Terminal:**
```
📥 [15:04:05] 200 | POST /api/login | 45ms | 127.0.0.1
📥 [15:04:10] 201 | POST /api/trades | 23ms | 127.0.0.1
```

### 🔥 Error Fix #3: Listen Address

> [!WARNING]
> **ปัญหา:** Backend Listen แค่ `localhost:8080` ทำให้เข้าจาก IP อื่นไม่ได้

**วิธีแก้:**
```go
// ❌ ก่อนแก้
app.Listen("localhost:8080")  // รับแค่ localhost

// ✅ หลังแก้
app.Listen("0.0.0.0:8080")    // รับจากทุก Interface
```

**คำอธิบาย:**
- `localhost` = 127.0.0.1 เท่านั้น
- `0.0.0.0` = ทุก Network Interface (รวม LAN, WSL, Docker)

### 📌 API Routes ทั้งหมด:

```go
api := app.Group("/api")

// Auth Routes (Public - ไม่ต้อง Login)
api.Post("/register", handlers.Register)
api.Post("/login", handlers.Login)

// Trade Routes (Protected - ต้อง Login)
trades := api.Group("/trades", handlers.JWTMiddleware)
trades.Post("/", handlers.CreateTrade)      // สร้างเทรด
trades.Get("/", handlers.GetTrades)         // ดูประวัติ
trades.Get("/:id", handlers.GetTrade)       // ดูเทรดเดียว
trades.Put("/:id", handlers.UpdateTrade)    // แก้ไข/ปิดเทรด
trades.Delete("/:id", handlers.DeleteTrade) // ลบเทรด
```

**คำอธิบาย Keyword:**
| Keyword | คำอธิบาย |
|---------|----------|
| `app.Group("/api")` | สร้าง Route Group มี Prefix `/api` |
| `api.Post()` | HTTP POST Method |
| `handlers.JWTMiddleware` | Middleware เช็ค Token ก่อนเข้า Route |
| `trades.Post("/")` | = POST /api/trades (สืบทอด prefix) |
| `:id` | Path Parameter (dynamic) |

---

## 🔐 2. `auth.go` - Authentication Handler (268 บรรทัด)
**ตำแหน่ง:** `backend/internal/handlers/auth.go`  
**หน้าที่:** สมัครสมาชิก, Login, สร้าง JWT Token

### 📊 โครงสร้าง Models:

```go
// User Model - โครงสร้างข้อมูลผู้ใช้
type User struct {
    ID        uint           `gorm:"primarykey" json:"id"`
    Username  string         `gorm:"column:username;unique;not null" json:"username"`
    Email     string         `gorm:"column:email" json:"email"`
    Password  string         `gorm:"column:password_hash;not null" json:"-"`  // 🔥 ไม่ส่งกลับ
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

**คำอธิบาย GORM Tags:**
| Tag | คำอธิบาย |
|-----|----------|
| `gorm:"primarykey"` | Primary Key ของ Table |
| `gorm:"column:xxx"` | ชื่อ Column ใน Database |
| `gorm:"unique"` | ห้ามค่าซ้ำ |
| `gorm:"not null"` | ห้าม NULL |
| `json:"-"` | ไม่ส่งกลับใน JSON Response |

### 🔥 Error Fix #4: Column Name Mismatch

> [!CAUTION]
> **ปัญหา:** GORM หา Column `password` ไม่เจอ เพราะใน Database ชื่อ `password_hash`

**วิธีแก้:**
```go
// ❌ ก่อนแก้
Password string `gorm:"not null" json:"-"`

// ✅ หลังแก้
Password string `gorm:"column:password_hash;not null" json:"-"`
```

### 📌 Register Function (สมัครสมาชิก):

```go
// POST /api/register
func Register(c *fiber.Ctx) error {
    // 1. รับข้อมูลจาก Request Body
    var req RegisterRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error": "ข้อมูลไม่ถูกต้อง",
        })
    }

    // 2. Validation
    if req.Username == "" || req.Password == "" {
        return c.Status(400).JSON(fiber.Map{
            "error": "กรุณากรอก Username และ Password",
        })
    }

    if len(req.Password) < 6 {
        return c.Status(400).JSON(fiber.Map{
            "error": "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
        })
    }

    // 3. 🔥 เช็ค Username ซ้ำ (Error Fix #5)
    var existingUser User
    if err := database.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
        return c.Status(409).JSON(fiber.Map{
            "error": "Username นี้ถูกใช้แล้ว",
        })
    }

    // 4. Hash Password ด้วย bcrypt
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "error": "ไม่สามารถ Hash Password ได้",
        })
    }

    // 5. Create User
    user := User{
        Username: req.Username,
        Email:    req.Email,
        Password: string(hashedPassword),  // เก็บ Hash ไม่ใช่ Password จริง!
    }

    // 6. Save to Database
    if err := database.DB.Create(&user).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{
            "error": "ไม่สามารถสร้างบัญชีได้",
        })
    }

    // 7. Response (ไม่ส่ง Password กลับ)
    return c.Status(201).JSON(fiber.Map{
        "message": "สมัครสมาชิกสำเร็จ! 🎉",
        "user": fiber.Map{
            "id":       user.ID,
            "username": user.Username,
            "email":    user.Email,
        },
    })
}
```

### 🔐 Password Hashing กับ bcrypt:

```
╔════════════════════════════════════════════════════════════════╗
║              PASSWORD SECURITY FLOW                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Register:                                                      ║
║  ┌──────────┐     bcrypt.GenerateFromPassword      ┌──────────┐║
║  │"mypass123"│ ──────────────────────────────────▶ │"$2a$12..."││
║  │ (Plain)   │           Cost = 12                 │ (Hash)   │║
║  └──────────┘                                      └──────────┘║
║                                                        │        ║
║                                                        ▼        ║
║                                               ┌──────────────┐  ║
║                                               │  Database    │  ║
║                                               │ password_hash│  ║
║                                               └──────────────┘  ║
║                                                        │        ║
║  Login:                                                │        ║
║  ┌──────────┐     bcrypt.CompareHashAndPassword  ┌────▼──────┐ ║
║  │"mypass123"│ ─────────────────────────────────▶│"$2a$12..."│ ║
║  │ (Input)   │        ✅ Match? Login OK!        │ (DB Hash) │ ║
║  └──────────┘                                    └───────────┘ ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

**ทำไมต้อง Hash Password?**
1. ถ้า Database โดน Hack, Hacker ได้แค่ Hash ไม่ใช่ Password จริง
2. Hash ไม่สามารถ Reverse กลับเป็น Password ได้
3. Cost = 12 หมายถึง 2^12 = 4,096 iterations (ยิ่งสูงยิ่งช้าแต่ปลอดภัย)

### 📌 Login Function (เข้าสู่ระบบ):

```go
// POST /api/login
func Login(c *fiber.Ctx) error {
    // 1. รับข้อมูล
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error": "ข้อมูลไม่ถูกต้อง",
        })
    }

    // 2. หา User ใน Database
    var user User
    if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
        // 🔥 Security: ไม่บอกว่า Username ผิดหรือ Password ผิด
        return c.Status(401).JSON(fiber.Map{
            "error": "Username หรือ Password ไม่ถูกต้อง",
        })
    }

    // 3. 🔥 เทียบ Password (Error Fix #6)
    if err := bcrypt.CompareHashAndPassword(
        []byte(user.Password),    // Hash จาก DB
        []byte(req.Password),     // Plain จาก Input
    ); err != nil {
        return c.Status(401).JSON(fiber.Map{
            "error": "Username หรือ Password ไม่ถูกต้อง",
        })
    }

    // 4. สร้าง JWT Token
    expiresAt := time.Now().Add(24 * time.Hour)  // หมดอายุ 24 ชม.

    claims := JWTClaims{
        UserID:   user.ID,
        Username: user.Username,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expiresAt),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "mmrrdikub",
        },
    }

    // 5. Sign Token
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(getJWTSecret()))
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "error": "ไม่สามารถสร้าง Token ได้",
        })
    }

    // 6. Response
    return c.JSON(AuthResponse{
        Token:     tokenString,
        ExpiresAt: expiresAt.Unix(),
        User: struct {
            ID       uint   `json:"id"`
            Username string `json:"username"`
            Email    string `json:"email"`
        }{
            ID:       user.ID,
            Username: user.Username,
            Email:    user.Email,
        },
    })
}
```

### 🔐 JWT Token Structure:

```
╔══════════════════════════════════════════════════════════════════╗
║                    JWT TOKEN STRUCTURE                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                           ║
║  eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InRlc3QiLCJleHAiOjE3...         ║
║  .SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c                    ║
║                                                                   ║
║  ├─────────────┼────────────────────────┼─────────────────────┤  ║
║  │   HEADER    │        PAYLOAD         │      SIGNATURE      │  ║
║  │             │                        │                     │  ║
║  │ {           │ {                      │ HMACSHA256(         │  ║
║  │   "alg":    │   "user_id": 1,        │   base64(header) +  │  ║
║  │   "HS256",  │   "username": "test",  │   "." +             │  ║
║  │   "typ":    │   "exp": 1738000000,   │   base64(payload),  │  ║
║  │   "JWT"     │   "iat": 1737913600    │   secret            │  ║
║  │ }           │ }                      │ )                   │  ║
║  └─────────────┴────────────────────────┴─────────────────────┘  ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
```

**คำอธิบาย JWT:**
| ส่วน | คำอธิบาย |
|------|----------|
| **Header** | Algorithm ที่ใช้ (HS256) + Type (JWT) |
| **Payload** | ข้อมูลที่เก็บใน Token (user_id, username, exp) |
| **Signature** | ลายเซ็นยืนยันว่า Token ไม่ถูกแก้ไข |
| **exp** | Expiration Time (Unix timestamp) |
| **iat** | Issued At (เวลาที่สร้าง) |

---

## 🛡️ 3. `middleware.go` - JWT Middleware (70 บรรทัด)
**ตำแหน่ง:** `backend/internal/handlers/middleware.go`  
**หน้าที่:** ตรวจสอบ Token ก่อนเข้าถึง Protected Routes

### 📌 Middleware Flow:

```
╔════════════════════════════════════════════════════════════════╗
║                  JWT MIDDLEWARE FLOW                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Frontend Request                                               ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ GET /api/trades                                            │ ║
║  │ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cC...        │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                            │                                    ║
║                            ▼                                    ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ JWTMiddleware()                                            │ ║
║  │                                                            │ ║
║  │ 1. ดึง Authorization Header                                │ ║
║  │    ↳ ไม่มี? → 401 "กรุณา Login ก่อน"                       │ ║
║  │                                                            │ ║
║  │ 2. แยก "Bearer <token>"                                    │ ║
║  │    ↳ รูปแบบผิด? → 401 "รูปแบบ Token ไม่ถูกต้อง"            │ ║
║  │                                                            │ ║
║  │ 3. Verify + Parse Token                                    │ ║
║  │    ↳ หมดอายุ/ปลอม? → 401 "Token ไม่ถูกต้องหรือหมดอายุ"    │ ║
║  │                                                            │ ║
║  │ 4. เก็บ User Info ใน Context                               │ ║
║  │    c.Locals("userID", claims.UserID)                       │ ║
║  │    c.Locals("username", claims.Username)                   │ ║
║  │                                                            │ ║
║  │ 5. c.Next() → ไป Handler ถัดไป                             │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                            │                                    ║
║                            ▼                                    ║
║  ┌────────────────────────────────────────────────────────────┐ ║
║  │ GetTrades() - Handler                                      │ ║
║  │                                                            │ ║
║  │ userID := GetCurrentUserID(c)  // ดึงจาก Context          │ ║
║  │ // ดึงเฉพาะ Trades ของ User นี้                           │ ║
║  └────────────────────────────────────────────────────────────┘ ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
```

### 📌 Middleware Code:

```go
func JWTMiddleware(c *fiber.Ctx) error {
    // 1. ดึง Authorization Header
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(401).JSON(fiber.Map{
            "error": "กรุณา Login ก่อน (ไม่มี Authorization Header)",
        })
    }

    // 2. เช็ครูปแบบ "Bearer <token>"
    parts := strings.Split(authHeader, " ")
    if len(parts) != 2 || parts[0] != "Bearer" {
        return c.Status(401).JSON(fiber.Map{
            "error": "รูปแบบ Token ไม่ถูกต้อง (ต้องเป็น: Bearer <token>)",
        })
    }

    tokenString := parts[1]

    // 3. Parse และ Verify Token
    claims, err := GetUserFromToken(tokenString)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{
            "error":   "Token ไม่ถูกต้องหรือหมดอายุ",
            "message": err.Error(),
        })
    }

    // 4. เก็บ User Info ใน Context
    c.Locals("userID", claims.UserID)
    c.Locals("username", claims.Username)

    // 5. ไป Handler ถัดไป
    return c.Next()
}
```

### 📌 Helper Functions:

```go
// ดึง User ID จาก Context
func GetCurrentUserID(c *fiber.Ctx) uint {
    userID, ok := c.Locals("userID").(uint)
    if !ok {
        return 0
    }
    return userID
}

// ดึง Username จาก Context
func GetCurrentUsername(c *fiber.Ctx) string {
    username, ok := c.Locals("username").(string)
    if !ok {
        return ""
    }
    return username
}
```

---

## 📊 4. `trade.go` - Trade Handler (499 บรรทัด)
**ตำแหน่ง:** `backend/internal/handlers/trade.go`  
**หน้าที่:** CRUD Operations สำหรับ Trading Journal

### 📊 Trade Model (Pro-grade):

```go
type Trade struct {
    ID        uint           `gorm:"primarykey" json:"id"`
    UserID    uint           `gorm:"not null;index" json:"user_id"`

    // Basic Info
    Pair      string         `gorm:"size:50;not null" json:"pair"`
    Side      string         `gorm:"size:10;not null" json:"side"` // LONG, SHORT

    // Prices
    EntryPrice float64       `gorm:"not null" json:"entry_price"`
    ExitPrice  float64       `json:"exit_price"`
    StopLoss   float64       `json:"stop_loss"`
    TakeProfit float64       `json:"take_profit"`

    // Position Sizing
    PositionSize float64     `gorm:"not null" json:"position_size"`
    Quantity     float64     `json:"quantity"`
    Leverage     int         `gorm:"default:1" json:"leverage"`

    // 🔥 NEW: Risk Management Fields
    RiskPercent      float64 `json:"risk_percent"`
    MaxWin           float64 `json:"max_win"`
    MaxLoss          float64 `json:"max_loss"`
    RiskRewardRatio  float64 `json:"risk_reward_ratio"`
    Fee              float64 `json:"fee"`

    // Trade Info
    EntryReason string      `json:"entry_reason"`
    SetupScore  int         `json:"setup_score"`  // 1-5 stars

    // P&L
    PnL        float64      `json:"pnl"`
    PnLPercent float64      `json:"pnl_percent"`
    Status     string       `gorm:"default:'OPEN'" json:"status"` // OPEN, WIN, LOSS

    // Notes & Tags
    Notes      string       `json:"notes"`
    Tags       string       `json:"tags"`

    // Timestamps
    EntryTime  *time.Time   `json:"entry_time"`
    ExitTime   *time.Time   `json:"exit_time"`
    OpenedAt   *time.Time   `json:"opened_at"`
    ClosedAt   *time.Time   `json:"closed_at"`
    CreatedAt  time.Time    `json:"created_at"`
    UpdatedAt  time.Time    `json:"updated_at"`
    DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
```

### 🔥 Error Fix #7: Missing Database Columns

> [!CAUTION]
> **ปัญหา:** บันทึก Trade ไม่ได้เพราะ Column `opened_at` และ `closed_at` ไม่มีใน Database

**SQL Migration ที่สร้าง:**
```sql
-- Add opened_at column
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;

-- Add closed_at column
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Extend pair column (error: value too long for type character varying(20))
ALTER TABLE trades
ALTER COLUMN pair TYPE VARCHAR(50);

-- Set default for existing rows
UPDATE trades SET opened_at = created_at WHERE opened_at IS NULL;
```

### 🔥 Error Fix #8: Pair Validation

> [!WARNING]
> **ปัญหา:** User พิมพ์ Email เป็น Pair → `value too long for type character varying(20)`

**วิธีแก้ - Backend:**
```go
// Validate Pair format (XXX/XXX, max 50 chars)
if len(req.Pair) > 50 {
    return c.Status(400).JSON(fiber.Map{
        "error": "คู่เทรดยาวเกินไป (สูงสุด 50 ตัวอักษร)",
    })
}
if !strings.Contains(req.Pair, "/") {
    return c.Status(400).JSON(fiber.Map{
        "error": "รูปแบบคู่เทรดไม่ถูกต้อง (ต้องเป็น XXX/USDT)",
    })
}
```

**วิธีแก้ - Frontend:**
```typescript
// Validate pair format before save
const pairPattern = /^[A-Z0-9]{1,10}\/[A-Z0-9]{1,10}$/;
if (!inputs.pair || !pairPattern.test(inputs.pair)) {
    setError('❌ คู่เทรดต้องเป็นรูปแบบ XXX/USDT');
    return;
}
```

### 📌 CreateTrade Function:

```go
// POST /api/trades
func CreateTrade(c *fiber.Ctx) error {
    // 1. ดึง User ID จาก Middleware
    userID := GetCurrentUserID(c)
    if userID == 0 {
        return c.Status(401).JSON(fiber.Map{
            "error": "ไม่พบข้อมูล User",
        })
    }

    // 2. Parse Request Body
    var req CreateTradeRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "error": "ข้อมูลไม่ถูกต้อง",
        })
    }

    // 3. Validation
    if req.Pair == "" || req.Side == "" || req.EntryPrice <= 0 {
        return c.Status(400).JSON(fiber.Map{
            "error": "กรุณากรอกข้อมูลให้ครบ",
        })
    }

    // 4. คำนวณ Setup Score อัตโนมัติ
    setupScore := req.SetupScore
    if setupScore == 0 && req.RiskRewardRatio > 0 {
        setupScore = calculateSetupScore(req.RiskRewardRatio, req.RiskPercent)
    }

    // 5. กำหนดเวลา
    now := time.Now()
    entryTime := &now
    if req.EntryTime != nil {
        entryTime = req.EntryTime
    }

    // 6. สร้าง Trade Object
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
        SetupScore:      setupScore,
        Notes:           req.Notes,
        Tags:            req.Tags,
        Status:          "OPEN",
        EntryTime:       entryTime,
        OpenedAt:        &now,
    }

    // 7. Save to Database
    if err := database.DB.Create(&trade).Error; err != nil {
        log.Printf("❌ CreateTrade Error: %v", err)
        return c.Status(500).JSON(fiber.Map{
            "error":   "ไม่สามารถบันทึกเทรดได้",
            "message": err.Error(),
        })
    }

    return c.Status(201).JSON(trade)
}
```

### 📌 GetTrades Function (พร้อม Filter + Sort):

```go
// GET /api/trades
func GetTrades(c *fiber.Ctx) error {
    userID := GetCurrentUserID(c)

    // Parse Query Parameters
    var filter TradeFilter
    c.QueryParser(&filter)

    // Default values
    if filter.Limit == 0 || filter.Limit > 100 {
        filter.Limit = 20
    }
    if filter.SortBy == "" {
        filter.SortBy = "created_at"
    }
    if filter.SortDir == "" {
        filter.SortDir = "DESC"
    }

    // Build Query
    query := database.DB.Model(&Trade{}).Where("user_id = ?", userID)

    // Apply Filters
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    if filter.Pair != "" {
        query = query.Where("pair = ?", filter.Pair)
    }
    if filter.Side != "" {
        query = query.Where("side = ?", filter.Side)
    }

    // Count Total
    var total int64
    query.Count(&total)

    // Sort + Paginate
    orderClause := fmt.Sprintf("%s %s", filter.SortBy, filter.SortDir)
    query = query.Order(orderClause).Offset(filter.Offset).Limit(filter.Limit)

    // Fetch
    var trades []Trade
    if err := query.Find(&trades).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{
            "error": "ไม่สามารถดึงข้อมูลได้",
        })
    }

    // Calculate Stats
    var stats struct {
        TotalPnL  float64
        WinCount  int64
        LossCount int64
        OpenCount int64
    }
    database.DB.Model(&Trade{}).Where("user_id = ?", userID).
        Select("COALESCE(SUM(pnl), 0) as total_pnl").Row().Scan(&stats.TotalPnL)
    database.DB.Model(&Trade{}).Where("user_id = ? AND status = 'WIN'", userID).Count(&stats.WinCount)
    database.DB.Model(&Trade{}).Where("user_id = ? AND status = 'LOSS'", userID).Count(&stats.LossCount)
    database.DB.Model(&Trade{}).Where("user_id = ? AND status = 'OPEN'", userID).Count(&stats.OpenCount)

    return c.JSON(fiber.Map{
        "trades": trades,
        "total":  total,
        "stats": fiber.Map{
            "total_pnl":  stats.TotalPnL,
            "win_count":  stats.WinCount,
            "loss_count": stats.LossCount,
            "open_count": stats.OpenCount,
        },
    })
}
```

---

## 🗄️ 5. `postgres.go` - Database Connection (46 บรรทัด)
**ตำแหน่ง:** `backend/pkg/database/postgres.go`  
**หน้าที่:** เชื่อมต่อ PostgreSQL Database

### 📌 Connection Flow:

```go
package database

import (
    "fmt"
    "log"
    "os"

    "github.com/joho/godotenv"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

// Global Variable - ให้ไฟล์อื่นใช้ได้
var DB *gorm.DB

func ConnectDB() {
    // 1. โหลด .env file
    err := godotenv.Load()
    if err != nil {
        _ = godotenv.Load("../.env")  // ลองหาข้างนอก
    }

    // 2. อ่าน Database URL
    dsn := os.Getenv("DB_URL")
    if dsn == "" {
        log.Fatal("❌ Error: หาตัวแปร DB_URL ไม่เจอ!")
    }

    // 3. เชื่อมต่อ Database
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("❌ เชื่อมต่อ Database ไม่ได้: ", err)
    }

    // 4. เก็บ Connection เป็น Global
    DB = db
    fmt.Println("🚀 Database Connected Successfully!")
}
```

### 📌 .env Configuration:

```env
# Database Connection (Neon PostgreSQL)
DB_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# JWT Secret (สำคัญมาก! เปลี่ยนใน Production)
JWT_SECRET=your-super-secret-key-change-in-production
```

---

# 🌐 Frontend Integration (api.ts)

## 📌 Axios Configuration:

```typescript
// api.ts - Axios Instance สำหรับเชื่อมต่อ Backend

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,  // ส่ง Cookies
});
```

## 🔥 Request Interceptor (แนบ Token):

```typescript
api.interceptors.request.use(
    (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);

        // ดึง Token จาก localStorage
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token && config.headers) {
                // แนบ Token เป็น Bearer Token
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);
```

## 🔥 Response Interceptor (Handle Errors):

```typescript
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status}`);
        return response;
    },
    (error) => {
        if (!error.response) {
            // Network Error - Backend ไม่ตอบ
            console.error('🔥 NETWORK ERROR: Backend unreachable!');
            error.message = 'Network Error: ไม่สามารถเชื่อมต่อ Backend ได้';
        } else {
            const status = error.response.status;

            if (status === 401) {
                // 🔥 Token หมดอายุ/ไม่ถูกต้อง → Clear Token
                console.warn('🔓 Unauthorized - clearing token');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                }
            }
        }

        return Promise.reject(error);
    }
);
```

## 📌 API Functions:

```typescript
// Auth API
export const authAPI = {
    register: (data: { username: string; email: string; password: string }) => {
        return api.post('/register', data);
    },

    login: (data: { username: string; password: string }) => {
        return api.post('/login', data);
    },
};

// Trade API
export const tradeAPI = {
    create: (data: CreateTradeData) => api.post('/trades', data),
    getAll: (params?: TradeFilter) => api.get('/trades', { params }),
    getOne: (id: number) => api.get(`/trades/${id}`),
    update: (id: number, data: UpdateTradeData) => api.put(`/trades/${id}`, data),
    delete: (id: number) => api.delete(`/trades/${id}`),
};
```

---

# 🔄 Complete Integration Flow

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    COMPLETE INTEGRATION FLOW                           ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  1️⃣ USER REGISTRATION                                                  ║
║  ┌──────────────┐     POST /api/register    ┌──────────────────────┐  ║
║  │   Frontend   │ ────────────────────────▶ │     Backend          │  ║
║  │   Register   │  { username, email, pass} │  handlers.Register() │  ║
║  │   Form       │ ◀──────────────────────── │  bcrypt.Hash(pass)   │  ║
║  └──────────────┘     { message: "OK" }     │  database.Create()   │  ║
║                                              └──────────────────────┘  ║
║                                                        │               ║
║                                                        ▼               ║
║                                              ┌──────────────────────┐  ║
║                                              │     PostgreSQL       │  ║
║                                              │  INSERT INTO users   │  ║
║                                              └──────────────────────┘  ║
║                                                                        ║
║  2️⃣ USER LOGIN                                                         ║
║  ┌──────────────┐      POST /api/login      ┌──────────────────────┐  ║
║  │   Frontend   │ ────────────────────────▶ │     Backend          │  ║
║  │   Login      │   { username, password }  │  handlers.Login()    │  ║
║  │   Form       │ ◀──────────────────────── │  bcrypt.Compare()    │  ║
║  │              │   { token: "eyJ..." }     │  jwt.NewWithClaims() │  ║
║  │  localStorage│                           └──────────────────────┘  ║
║  │  .setItem(   │                                                      ║
║  │   'token',   │                                                      ║
║  │   token)     │                                                      ║
║  └──────────────┘                                                      ║
║                                                                        ║
║  3️⃣ CREATE TRADE (Protected)                                          ║
║  ┌──────────────┐      POST /api/trades     ┌──────────────────────┐  ║
║  │   Frontend   │ ────────────────────────▶ │   JWTMiddleware()    │  ║
║  │   Calculator │  Authorization: Bearer... │  ├─ Verify Token     │  ║
║  │   Component  │  { pair, entry_price...}  │  ├─ Extract UserID   │  ║
║  │              │ ◀──────────────────────── │  └─ c.Next()         │  ║
║  │              │   { id: 1, pair: "BTC"}   │         │             │  ║
║  └──────────────┘                           │         ▼             │  ║
║                                              │  CreateTrade()       │  ║
║                                              │  database.Create()   │  ║
║                                              └──────────────────────┘  ║
║                                                        │               ║
║                                                        ▼               ║
║                                              ┌──────────────────────┐  ║
║                                              │     PostgreSQL       │  ║
║                                              │  INSERT INTO trades  │  ║
║                                              └──────────────────────┘  ║
║                                                                        ║
║  4️⃣ GET TRADE HISTORY (Protected)                                     ║
║  ┌──────────────┐      GET /api/trades      ┌──────────────────────┐  ║
║  │   Frontend   │ ────────────────────────▶ │   JWTMiddleware()    │  ║
║  │   Dashboard  │  Authorization: Bearer... │  ├─ Verify Token     │  ║
║  │   Component  │  ?status=OPEN&limit=20   │  └─ GetTrades()      │  ║
║  │              │ ◀──────────────────────── │     Filter + Sort    │  ║
║  │  trades.map()│  { trades: [...], stats } │     Paginate         │  ║
║  └──────────────┘                           └──────────────────────┘  ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

# 📝 สรุป Error ที่แก้ไขพร้อมวิธีแก้

## Error #1: CORS Blocked
```
Access to XMLHttpRequest blocked by CORS policy
```
**สาเหตุ:** Browser ห้าม Cross-Origin Request  
**แก้:** เพิ่ม CORS Middleware ใน main.go

## Error #2: 401 Unauthorized
```
{ "error": "กรุณา Login ก่อน" }
```
**สาเหตุ:** ไม่ได้ส่ง Token ไปกับ Request  
**แก้:** เพิ่ม Request Interceptor แนบ Authorization Header

## Error #3: Password Mismatch
```
{ "error": "Username หรือ Password ไม่ถูกต้อง" }
```
**สาเหตุ:** เทียบ Plain Password กับ Hash ไม่ถูกวิธี  
**แก้:** ใช้ bcrypt.CompareHashAndPassword()

## Error #4: Column Not Found
```
ERROR: column "password" does not exist
```
**สาเหตุ:** GORM คิดว่า Column ชื่อ "password" แต่จริงๆ ชื่อ "password_hash"  
**แก้:** เพิ่ม gorm:"column:password_hash" tag

## Error #5: Duplicate Username
```
ERROR: duplicate key value violates unique constraint
```
**สาเหตุ:** ไม่ได้เช็ค Username ซ้ำก่อน Insert  
**แก้:** เพิ่ม WHERE username = ? ก่อน Create

## Error #6: Missing Columns
```
ERROR: column "opened_at" does not exist
```
**สาเหตุ:** Schema ไม่มี Column แต่ Model มี  
**แก้:** สร้าง SQL Migration เพิ่ม Column

## Error #7: Value Too Long
```
ERROR: value too long for type character varying(20)
```
**สาเหตุ:** User พิมพ์ค่ายาวเกิน Column Size  
**แก้:** ALTER COLUMN เป็น VARCHAR(50) + Validation

## Error #8: Network Error
```
Network Error: ไม่สามารถเชื่อมต่อ Backend ได้
```
**สาเหตุ:** Backend Listen แค่ localhost  
**แก้:** เปลี่ยน app.Listen("0.0.0.0:8080")

---

# 🎓 Key Golang Concepts ที่ใช้

| Concept | คำอธิบาย | ตัวอย่าง |
|---------|----------|----------|
| **Struct** | โครงสร้างข้อมูล | `type User struct { ... }` |
| **Struct Tags** | Metadata สำหรับ Serialization | `json:"username" gorm:"not null"` |
| **Pointer** | Reference ไปยัง Memory Address | `*time.Time` (nullable) |
| **Interface** | สัญญาว่าต้องมี Method อะไรบ้าง | `error` interface |
| **Error Handling** | ตรวจสอบ error ทุกครั้ง | `if err != nil { ... }` |
| **Middleware** | Function ที่รันก่อน Handler | `JWTMiddleware(c)` |
| **Context** | ส่งข้อมูลระหว่าง Middleware | `c.Locals("userID")` |
| **Global Variable** | ตัวแปรที่ใช้ได้ทุกที่ | `var DB *gorm.DB` |
| **Goroutine** | Concurrent Execution | (ใช้ใน Fiber) |
| **Package** | การจัดกลุ่มโค้ด | `package handlers` |

---

*📘 Document Version: 1.0*  
*📅 Created: 2026-02-01*  
*📐 Total Lines: 1,100+*  
*🤖 Generated by Antigravity AI Assistant*
