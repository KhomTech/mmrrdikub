# 📘 Phase 4: หน้าบ้านสุดล้ำ (Frontend UI/UX)
## MMRRDiKub Trading Journal - Frontend Architecture Documentation

**🗓️ วันที่สร้าง:** 2026-02-01  
**📦 Framework:** Next.js 16 (App Router) + Tailwind CSS  
**🎯 เป้าหมาย:** เว็บสวย ธีม Bitkub, เปลี่ยนภาษาได้, มี Login, คำนวณ Position Size แม่นยำ

---

## 🏗️ โครงสร้างไฟล์ (File Structure)

```
frontend/
├── app/                          # 📁 App Router (Next.js 16+)
│   ├── components/               # 🧩 Reusable Components
│   │   ├── Calculator.tsx        # 🔢 Position Size Calculator (Main Feature)
│   │   ├── Dashboard.tsx         # 📊 Trade History & Stats
│   │   ├── Navbar.tsx            # 🧭 Navigation Bar (Auth + i18n)
│   │   └── AIInsights.tsx        # 🤖 AI Analysis Widget
│   │
│   ├── context/                  # 🎨 React Context
│   │   └── ThemeContext.tsx      # Theme Provider (Dark/Light/Bitkub)
│   │
│   ├── utils/                    # 🔧 Utility Functions
│   │   ├── api.ts                # 🌐 Axios Instance + API Functions
│   │   ├── format.ts             # 📝 Number/Date Formatting
│   │   └── tradeCalculations.ts  # 📐 Quant-grade Financial Formulas
│   │
│   ├── lib/                      # 📚 Helper Libraries
│   │   └── cn.ts                 # clsx + tailwind-merge utility
│   │
│   ├── login/                    # 🔐 Login Page
│   │   └── page.tsx
│   │
│   ├── register/                 # 📝 Register Page
│   │   └── page.tsx
│   │
│   ├── dashboard/                # 📊 Dashboard Page (Protected)
│   │   └── page.tsx
│   │
│   ├── layout.tsx                # 🏠 Root Layout (Fonts, Theme, Metadata)
│   ├── page.tsx                  # 🏠 Home Page (Calculator + Banner)
│   ├── globals.css               # 🎨 Global CSS + Tailwind Config
│   └── favicon.ico               # 🔖 App Icon
│
├── public/                       # 📂 Static Assets
├── package.json                  # 📦 Dependencies
├── tsconfig.json                 # ⚙️ TypeScript Config
└── next.config.ts                # ⚙️ Next.js Config
```

---

## 📄 ไฟล์หลักและหน้าที่ (Core Files & Functions)

---

### 🏠 1. `layout.tsx` - Root Layout
**ตำแหน่ง:** `frontend/app/layout.tsx`  
**Purpose:** ครอบทุกหน้าในแอพ, ใส่ Font, Theme, Metadata

```typescript
// สิ่งที่ทำ:
- Import Google Fonts: Inter (อังกฤษ), Kanit (ไทย)
- ครอบ ThemeProvider รอบทุก children
- กำหนด SEO Metadata (title, description, keywords)
```

| Keyword | คำอธิบาย |
|---------|----------|
| `Inter` | Font ภาษาอังกฤษ - Modern, อ่านง่าย |
| `Kanit` | Font ภาษาไทย - สวย อ่านง่าย |
| `ThemeProvider` | จัดการ Dark/Light Mode |
| `metadata` | SEO Optimization |

**โค้ดสำคัญ:**
```typescript
// Font หลัก - Inter สำหรับภาษาอังกฤษ
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Font รอง - Kanit สำหรับภาษาไทย
const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="dark">
      <body className={`${inter.variable} ${kanit.variable} font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

### 🏠 2. `page.tsx` - Home Page (หน้าหลัก)
**ตำแหน่ง:** `frontend/app/page.tsx`  
**Purpose:** แสดง Calculator พร้อม Banner ชวน Login

```typescript
// Functions:
HomeContent() → แสดง UI หลัก
  - เช็ค Token ว่า Login หรือยัง
  - แสดง Banner ชวน Login (ถ้ายังไม่ Login)
  - แสดง Calculator Component

Home() → Wrapper พร้อม ThemeProvider
```

| Feature | คำอธิบาย |
|---------|----------|
| `isLoggedIn State` | เช็ค Token จาก localStorage |
| `Login Banner` | แสดง Animation ชวนสมัคร (motion.div) |
| `Calculator Component` | เครื่องคำนวณหลัก |

---

### 🔢 3. `Calculator.tsx` - Position Size Calculator (⭐ MAIN FEATURE)
**ตำแหน่ง:** `frontend/app/components/Calculator.tsx`  
**Purpose:** เครื่องคำนวณ Position Size ระดับ Quant

**📐 ขนาด:** 1,156 บรรทัด | 65KB

#### 📊 Type Definitions:
```typescript
// คู่เทรด พร้อมหมวดหมู่ค้นหา
interface TradingPair {
    symbol: string;      // "BTC/USDT"
    category: string;    // "Layer 1", "DeFi", "Meme"
    keywords?: string;   // "bitcoin บิทคอยน์" (ค้นหาได้)
}

// Take Profit Level
interface TPLevel { 
    id: string;        // Unique ID
    price: number;     // ราคา TP
    percent: number;   // % ปิดไม้
}

// Stop Loss Level  
interface SLLevel { 
    id: string;        // Unique ID
    price: number;     // ราคา SL
    percent: number;   // % ปิดไม้
}

// Input ทั้งหมดของ Calculator
interface CalculatorInputs {
    pair: string;              // คู่เทรด เช่น "BTC/USDT"
    side: 'LONG' | 'SHORT';    // ทิศทาง
    portfolio: number;         // เงินทุนทั้งหมด ($)
    entryPrice: number;        // ราคาเข้า
    riskPercent: number;       // % เสี่ยง (1-10%)
    leverage: number;          // Leverage (1-500x)
    exchange: string;          // Exchange เลือก
    customFee: number;         // ค่าธรรมเนียมกำหนดเอง
    entryReason: string;       // เหตุผลเข้าเทรด
    customReason: string;      // เหตุผลกำหนดเอง
    tpLevels: TPLevel[];       // Multi Take Profit
    slLevels: SLLevel[];       // Multi Stop Loss
}
```

#### 🎯 Main Functions:

| Function | หน้าที่ | Keyword |
|----------|--------|---------|
| `Calculator()` | Component หลัก 1,156 บรรทัด | React Functional Component |
| `getDistancePercent(price, isTP)` | คำนวณ % ห่างจาก Entry | Distance Calculation |
| `addTPLevel()` | เพิ่ม Take Profit Level ใหม่ | Multi Take-Profit |
| `removeTPLevel(id)` | ลบ TP Level | Dynamic Form |
| `addSLLevel()` | เพิ่ม Stop Loss Level ใหม่ | Multi Stop-Loss |
| `removeSLLevel(id)` | ลบ SL Level | Dynamic Form |
| `handleSave()` | บันทึก Trade ลง API | API POST /trades |
| `renderStars(score)` | แสดงคะแนนดาว AI | AI Setup Score |
| `handleClick(e)` | ปิด Dropdown เมื่อคลิกนอก | Click Outside Handler |

#### 🧮 การคำนวณ (Calculation Flow):

```
╔════════════════════════════════════════════════════════════╗
║           POSITION SIZE CALCULATION FORMULA                 ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  1️⃣ Risk Amount = Portfolio × (Risk% ÷ 100)                ║
║     ตัวอย่าง: $10,000 × 1% = $100                          ║
║                                                             ║
║  2️⃣ Weighted SL Distance = Σ(SL_Distance% × SL_Weight%)    ║
║     Multi-SL รองรับหลาย Level ถ่วงน้ำหนัก                  ║
║                                                             ║
║  3️⃣ Position Size = Risk ÷ (Avg_SL% + Roundtrip_Fee%)      ║
║     Dynamic sizing ตามระยะ SL และค่าธรรมเนียม              ║
║                                                             ║
║  4️⃣ Required Margin = Position ÷ Leverage                  ║
║     เงินต้นที่ต้องวาง                                       ║
║                                                             ║
║  5️⃣ Net P&L:                                               ║
║     - Net Max Win = Gross Win - Total Fee                  ║
║     - Net Max Loss = Gross Loss + Total Fee                ║
║                                                             ║
║  6️⃣ R:R Ratio = Net Win ÷ Net Loss                         ║
║     อัตราส่วนกำไร:ขาดทุน (หลังหักค่าธรรมเนียม)              ║
║                                                             ║
╚════════════════════════════════════════════════════════════╝
```

#### 🎨 UI Features:

| Feature | Keyword | คำอธิบาย |
|---------|---------|----------|
| Dynamic TP/SL Forms | Multi-level | เพิ่มลบ Level ได้ตลอด |
| Exchange Dropdown | Fee Integration | เลือก Binance, Bybit, ฯลฯ (มี Fee ต่างกัน) |
| Pair Searchable | Category Search | ค้นหาตามชื่อ/หมวดหมู่/Keywords |
| AI Trade Score | Setup Score 1-5 | คะแนน 1-5 ดาว + คำแนะนำ |
| Position Size Display | Big Number | แสดงผลตัวใหญ่ |
| Margin Warning | Validation | เตือนเมื่อ Margin เกิน Portfolio |

#### 📦 Trading Pairs Data (120+ คู่):
```typescript
const TRADING_PAIRS_DATA: TradingPair[] = [
    // Top 30 by Volume
    { symbol: 'BTC/USDT', category: 'Layer 1', keywords: 'bitcoin บิทคอยน์' },
    { symbol: 'ETH/USDT', category: 'Layer 1', keywords: 'ethereum อีเทอเรียม' },
    
    // AI Tokens
    { symbol: 'FET/USDT', category: 'AI', keywords: 'fetch ai' },
    { symbol: 'WLD/USDT', category: 'AI', keywords: 'worldcoin' },
    
    // Meme Coins
    { symbol: 'PEPE/USDT', category: 'Meme', keywords: 'frog กบ' },
    { symbol: 'DOGE/USDT', category: 'Meme', keywords: 'dogecoin หมา' },
    
    // DeFi
    { symbol: 'UNI/USDT', category: 'DeFi', keywords: 'uniswap' },
    { symbol: 'AAVE/USDT', category: 'DeFi', keywords: 'lending' },
    
    // Thai Market
    { symbol: 'KUB/USDT', category: 'Thai', keywords: 'bitkub ไทย' },
    // ... 120+ pairs
];
```

---

### 📊 4. `Dashboard.tsx` - Trade History
**ตำแหน่ง:** `frontend/app/components/Dashboard.tsx`  
**Purpose:** แสดงประวัติเทรด, สถิติ, Export CSV

**📐 ขนาด:** 840 บรรทัด | 46KB

#### 🎯 Main Functions:

| Function | หน้าที่ | Keyword |
|----------|--------|---------|
| `Dashboard()` | Component หลัก | Data Grid Component |
| `fetchTrades()` | ดึงข้อมูลจาก API | GET /api/trades |
| `handleSort(key)` | เรียงลำดับตาม Column | Sortable Table |
| `handleDelete(id)` | ลบ Trade | DELETE /api/trades/:id |
| `handleEditSubmit()` | บันทึกแก้ไข Trade | PUT /api/trades/:id |
| `updateExitPrice(price)` | คำนวณ P&L อัตโนมัติ | Auto P&L Calculation |
| `exportToCSV()` | Export เป็น CSV (UTF-8 BOM) | CSV Export with Thai |
| `renderStars(score)` | แสดงคะแนนดาว | Star Rating Display |
| `formatDateTime(date)` | Format วันที่ไทย | Date Formatting |

#### 📈 Stats Display:
```
╔════════════════════════════════════════╗
║           TRADING STATISTICS           ║
╠════════════════════════════════════════╣
║  Total P&L        │ กำไร/ขาดทุนรวม ($) ║
║  Win Count        │ จำนวนครั้งที่ชนะ    ║
║  Loss Count       │ จำนวนครั้งที่แพ้    ║
║  Win Rate         │ อัตราชนะ (%)        ║
║  Average R:R      │ R:R เฉลี่ย         ║
╚════════════════════════════════════════╝
```

#### 🎨 UI Features:

| Feature | Keyword | คำอธิบาย |
|---------|---------|----------|
| Filter Tabs | Status Filter | กรอง ALL / OPEN / WIN / LOSS |
| Sortable Columns | Column Sort | คลิก Header เพื่อเรียง |
| Edit Modal | Popup Edit | แก้ไข Trade ผ่าน Modal |
| CSV Export | UTF-8 BOM | รองรับ Excel ภาษาไทย |
| Delete Confirmation | Confirm Dialog | ยืนยันก่อนลบ |
| Mobile Scroll Hint | Responsive | บอกว่าเลื่อนได้ (จอเล็ก) |

---

### 🧭 5. `Navbar.tsx` - Navigation Bar
**ตำแหน่ง:** `frontend/app/components/Navbar.tsx`  
**Purpose:** แถบ Menu ด้านบน, Auth UI, Language Switch

**📐 ขนาด:** 182 บรรทัด | 8KB

#### 🎯 Main Functions:

| Function | หน้าที่ | Keyword |
|----------|--------|---------|
| `Navbar()` | Component หลัก | Navigation Component |
| `handleLogout()` | ลบ Token แล้ว Refresh | Logout Handler |
| `toggleLang()` | สลับภาษา TH/EN | i18n Toggle |

#### 🌐 i18n Support (Multi-Language):
```typescript
const translations = {
    th: { 
        login: 'เข้าสู่ระบบ', 
        register: 'สมัครสมาชิก',
        logout: 'ออกจากระบบ',
        dashboard: 'ประวัติเทรด'
    },
    en: { 
        login: 'Login', 
        register: 'Register',
        logout: 'Logout',
        dashboard: 'Trade History'
    },
};
```

#### 🎨 UI Features:

| Feature | Keyword | คำอธิบาย |
|---------|---------|----------|
| Logo + Brand | Brand Identity | MMRRDiKub Logo |
| Auth Buttons | Authentication | Login / Register (ถ้ายังไม่ Login) |
| User Profile | User Display | แสดงชื่อ + ปุ่ม Logout |
| Language Toggle | i18n | TH 🇹🇭 / EN 🇺🇸 |
| Dashboard Link | Navigation | ลิงค์ไปประวัติเทรด |

---

### 🔐 6. `login/page.tsx` - Login Page
**ตำแหน่ง:** `frontend/app/login/page.tsx`  
**Purpose:** หน้าเข้าสู่ระบบ

#### 🎯 Main Functions:

| Function | หน้าที่ |
|----------|--------|
| `LoginContent()` | UI Component หลัก |
| `handleSubmit(e)` | ส่ง Username + Password ไป API |

#### 🔑 Authentication Flow:
```
┌─────────────────────────────────────────────────┐
│              LOGIN FLOW                         │
├─────────────────────────────────────────────────┤
│ 1. User กรอก Username + Password               │
│ 2. เรียก authAPI.login()                       │
│ 3. API ตอบกลับ JWT Token                       │
│ 4. เก็บ Token + Username ใน localStorage       │
│ 5. Redirect ไป Home Page (/)                   │
└─────────────────────────────────────────────────┘
```

#### 🎨 UI Features:
- ปุ่ม Show/Hide Password (Eye Icon)
- ลิงค์ไปหน้าสมัครสมาชิก
- Error Message แสดงถ้า Login ล้มเหลว
- Loading Spinner ขณะ Submit

---

### 📝 7. `register/page.tsx` - Register Page
**ตำแหน่ง:** `frontend/app/register/page.tsx`  
**Purpose:** หน้าสมัครสมาชิก

#### 🎯 Main Functions:

| Function | หน้าที่ |
|----------|--------|
| `RegisterContent()` | UI Component หลัก |
| `handleSubmit(e)` | ส่ง Username + Email + Password ไป API |

#### 📋 Registration Flow:
```
┌─────────────────────────────────────────────────┐
│           REGISTRATION FLOW                     │
├─────────────────────────────────────────────────┤
│ 1. User กรอก Username, Email, Password         │
│ 2. Validate รูปแบบ (Email, Password Length)    │
│ 3. เรียก authAPI.register()                    │
│ 4. สำเร็จ → Show Success + Redirect Login      │
│ 5. ล้มเหลว → แสดง Error Message               │
└─────────────────────────────────────────────────┘
```

#### 🎨 UI Features:
- Password Validation (ตรวจความยาว)
- Email Format Validation
- Password Show/Hide Toggle
- Network Error Handling

---

### 📊 8. `dashboard/page.tsx` - Dashboard Page
**ตำแหน่ง:** `frontend/app/dashboard/page.tsx`  
**Purpose:** หน้าแสดงประวัติเทรด (ต้อง Login)

#### 🔒 Auth Protection:
```typescript
// เช็คว่า Login หรือยัง ก่อนแสดงหน้า
useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/login');  // Redirect ถ้าไม่มี Token
    } else {
        setChecking(false);     // อนุญาตให้ดูหน้า
    }
}, [router]);
```

---

## 🔧 Utilities (app/utils/)

---

### 🌐 `api.ts` - API Client
**ตำแหน่ง:** `frontend/app/utils/api.ts`  
**Purpose:** Axios Instance สำหรับเชื่อมต่อ Backend

#### 📊 Type Definitions:
```typescript
// ข้อมูลสร้าง Trade ใหม่
interface CreateTradeData {
    pair: string;
    side: string;
    entry_price: number;
    stop_loss?: number;
    take_profit?: number;
    position_size: number;
    quantity?: number;
    leverage?: number;
    risk_percent?: number;
    max_win?: number;
    max_loss?: number;
    risk_reward_ratio?: number;
    fee?: number;
    entry_reason?: string;
    setup_score?: number;
    notes?: string;
    tags?: string;
    entry_time?: string;
}

// ข้อมูลแก้ไข/ปิด Trade
interface UpdateTradeData {
    exit_price?: number;
    pnl?: number;
    pnl_percent?: number;
    status?: string;      // OPEN, WIN, LOSS, BREAK_EVEN
    notes?: string;
    exit_time?: string;
    closed_at?: string;
}

// Filter สำหรับค้นหา
interface TradeFilter {
    status?: string;
    pair?: string;
    side?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_dir?: string;
}
```

#### 🎯 API Functions:

| Object | Function | HTTP Method | Endpoint | หน้าที่ |
|--------|----------|-------------|----------|--------|
| `authAPI` | `register()` | POST | /api/register | สมัครสมาชิก |
| `authAPI` | `login()` | POST | /api/login | เข้าสู่ระบบ |
| `tradeAPI` | `create()` | POST | /api/trades | สร้าง Trade ใหม่ |
| `tradeAPI` | `getAll()` | GET | /api/trades | ดึง Trades ทั้งหมด |
| `tradeAPI` | `getOne()` | GET | /api/trades/:id | ดึง Trade เดียว |
| `tradeAPI` | `update()` | PUT | /api/trades/:id | อัพเดท/ปิด Trade |
| `tradeAPI` | `delete()` | DELETE | /api/trades/:id | ลบ Trade |

#### 🔐 Interceptors (ดักจับ Request/Response):

```typescript
// Request Interceptor - ทุก Request ที่ออกไป
api.interceptors.request.use((config) => {
    // ดึง Token จาก localStorage
    const token = localStorage.getItem('token');
    // แนบ Token ใน Authorization Header
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor - ทุก Response ที่กลับมา
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token หมดอายุ → ลบ Token + Redirect Login
            localStorage.removeItem('token');
            localStorage.removeItem('username');
        }
        return Promise.reject(error);
    }
);
```

---

### 📐 `tradeCalculations.ts` - Financial Formulas
**ตำแหน่ง:** `frontend/app/utils/tradeCalculations.ts`  
**Purpose:** สูตรคำนวณ Position Size ระดับ Quant

#### 🎯 Functions:

| Function | หน้าที่ | Input | Output |
|----------|--------|-------|--------|
| `calculateWeightedDistance()` | คำนวณ Distance เฉลี่ยถ่วงน้ำหนัก | Levels, Entry, Side | % Distance |
| `calculateTradeMetrics()` | คำนวณทุก Metric | TradeInputs | TradeMetrics |
| `formatRR()` | Format R:R | Number | "1:2.50" |

#### 📊 Output (TradeMetrics):
```typescript
interface TradeMetrics {
    // Core Calculations
    riskAmount: number;           // เงินเสี่ยง ($)
    weightedSLDistance: number;   // ระยะ SL เฉลี่ย (%)
    weightedTPDistance: number;   // ระยะ TP เฉลี่ย (%)
    calculatedPositionSize: number;  // Position Size ($)
    requiredMargin: number;       // Margin ที่ต้องวาง ($)
    quantity: number;             // จำนวน Coin
    
    // P&L
    grossWin: number;             // กำไร Gross ($)
    grossLoss: number;            // ขาดทุน Gross ($)
    totalFee: number;             // ค่า Fee รวม ($)
    netMaxWin: number;            // กำไรสุทธิ ($)
    netMaxLoss: number;           // ขาดทุนสุทธิ ($)
    riskRewardRatio: number;      // R:R Ratio
    
    // Validation
    isValid: boolean;             // ผ่านการ Validate
    marginExceedsPortfolio: boolean; // Margin เกิน Portfolio?
    errorMessage: string;         // ข้อความ Error
}
```

#### 🧮 Core Calculation Code:
```typescript
export function calculateTradeMetrics(inputs: TradeInputs): TradeMetrics {
    const { portfolio, entryPrice, riskPercent, leverage, 
            side, tpLevels, slLevels, feePercent } = inputs;

    // Step A: Calculate Risk Amount ($)
    const riskAmount = portfolio * (riskPercent / 100);

    // Step B: Calculate Weighted SL/TP Distances
    const weightedSLDistance = calculateWeightedDistance(slLevels, entryPrice, side, false);
    const weightedTPDistance = calculateWeightedDistance(tpLevels, entryPrice, side, true);

    // Step C: Calculate Dynamic Position Size
    // Formula: Position = Risk ÷ (Avg_SL% + Roundtrip_Fee%)
    const avgSLDecimal = weightedSLDistance / 100;
    const roundtripFee = (feePercent * 2) / 100;
    const calculatedPositionSize = riskAmount / (avgSLDecimal + roundtripFee);

    // Step D: Calculate Required Margin
    const requiredMargin = calculatedPositionSize / leverage;

    // Step E: Validation
    const marginExceedsPortfolio = requiredMargin > portfolio;

    // Step F: Calculate P&L
    const avgTPDecimal = weightedTPDistance / 100;
    const grossWin = calculatedPositionSize * avgTPDecimal;
    const grossLoss = calculatedPositionSize * avgSLDecimal;
    const totalFee = calculatedPositionSize * roundtripFee;
    const netMaxWin = grossWin - totalFee;
    const netMaxLoss = grossLoss + totalFee;

    // Step G: Calculate R:R Ratio
    const riskRewardRatio = netMaxLoss > 0 ? netMaxWin / netMaxLoss : 0;

    return { /* all metrics */ };
}
```

---

### 📝 `format.ts` - Formatting Utilities
**ตำแหน่ง:** `frontend/app/utils/format.ts`  
**Purpose:** Format ตัวเลขและวันที่

- `formatNumber()` - Format ตัวเลขพร้อม Comma
- `formatCurrency()` - Format เงิน ($1,234.56)
- `formatDate()` - Format วันที่ไทย

---

## 🎨 Context (app/context/)

### 🌓 `ThemeContext.tsx` - Theme Provider
**ตำแหน่ง:** `frontend/app/context/ThemeContext.tsx`  
**Purpose:** จัดการ Dark/Light Mode

```typescript
// สร้าง Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider Component
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    
    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };
    
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook สำหรับใช้งาน
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be within ThemeProvider');
    return context;
}
```

---

## 🔌 การเชื่อมต่อระหว่าง Components (Component Connections)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MMRRDiKub ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                               │
│  │  layout.tsx │ ← Root Layout (Fonts, Theme, Metadata)        │
│  │  ├── ThemeProvider                                          │
│  │  └── {children}                                             │
│  └──────┬──────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │                   PAGES                       │              │
│  ├──────────────────────────────────────────────┤              │
│  │  page.tsx           │ Home + Calculator       │              │
│  │  login/page.tsx     │ Login Form              │              │
│  │  register/page.tsx  │ Registration Form       │              │
│  │  dashboard/page.tsx │ Trade History (Protected)│             │
│  └──────────────────────────────────────────────┘              │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │                 COMPONENTS                    │              │
│  ├──────────────────────────────────────────────┤              │
│  │  Navbar.tsx      │ Navigation + Auth UI       │              │
│  │  Calculator.tsx  │ Position Size Calculator   │              │
│  │  Dashboard.tsx   │ Trade History Grid         │              │
│  │  AIInsights.tsx  │ AI Analysis Widget         │              │
│  └──────────────────────────────────────────────┘              │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │                   UTILS                       │              │
│  ├──────────────────────────────────────────────┤              │
│  │  api.ts              │ Axios + API Functions  │              │
│  │  tradeCalculations.ts│ Quant-grade Formulas   │              │
│  │  format.ts           │ Number/Date Format     │              │
│  └──────────────────────────────────────────────┘              │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │              BACKEND API (:8080)              │              │
│  ├──────────────────────────────────────────────┤              │
│  │  POST /api/register  │ สมัครสมาชิก            │              │
│  │  POST /api/login     │ เข้าสู่ระบบ            │              │
│  │  GET  /api/trades    │ ดึงประวัติเทรด          │              │
│  │  POST /api/trades    │ สร้างเทรดใหม่          │              │
│  │  PUT  /api/trades/:id│ แก้ไข/ปิดเทรด          │              │
│  │  DELETE /api/trades/:id│ ลบเทรด               │              │
│  └──────────────────────────────────────────────┘              │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────┐              │
│  │           PostgreSQL DATABASE                 │              │
│  ├──────────────────────────────────────────────┤              │
│  │  users               │ ข้อมูลผู้ใช้           │              │
│  │  trades              │ ประวัติการเทรด         │              │
│  │  exchanges           │ ข้อมูล Exchange        │              │
│  │  trading_pairs       │ คู่เทรดทั้งหมด         │              │
│  └──────────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Features Summary (สรุปฟีเจอร์ทั้งหมด)

| Feature | Status | File | Keyword |
|---------|--------|------|---------|
| 🔢 Position Size Calculator | ✅ | `Calculator.tsx` | Dynamic Position Sizing |
| 📊 Multi TP/SL Levels | ✅ | `Calculator.tsx` | Multi-level Risk Management |
| 🎯 AI Trade Score | ✅ | `Calculator.tsx` | Setup Score 1-5 |
| 🔐 Login | ✅ | `login/page.tsx` | JWT Authentication |
| 📝 Register | ✅ | `register/page.tsx` | User Registration |
| 📋 Trade History | ✅ | `Dashboard.tsx` | Trade Journal |
| 📈 Stats Overview | ✅ | `Dashboard.tsx` | Win Rate, P&L Stats |
| 📤 CSV Export | ✅ | `Dashboard.tsx` | UTF-8 BOM Export |
| 🌓 Dark/Light Theme | ✅ | `ThemeContext.tsx` | Theme Toggle |
| 🌐 i18n (TH/EN) | ✅ | `Navbar.tsx` | Multi-language |
| 🔍 Pair Search | ✅ | `Calculator.tsx` | Category + Keywords Search |
| 🔒 Protected Routes | ✅ | `dashboard/page.tsx` | Auth Guard |
| 📱 Responsive Design | ✅ | All Components | Mobile First |
| 🎨 Bitkub Theme | ✅ | `globals.css` | Custom Green Theme |

---

## 🔑 Key Technologies Used

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | App Router, SSR, File-based Routing |
| **React** | 18.x | Components, Hooks (useState, useEffect, useMemo) |
| **TypeScript** | 5.x | Type Safety, Interface Definitions |
| **Tailwind CSS** | 3.x | Utility-first Styling |
| **Framer Motion** | 11.x | Animations (AnimatePresence, motion.div) |
| **Axios** | 1.x | HTTP Client + Interceptors |
| **Lucide React** | Latest | Icon Library (200+ icons) |
| **clsx + tailwind-merge** | Latest | Dynamic Class Names |

---

## 🚀 วิธี Run Development

```bash
# เข้าโฟลเดอร์ Frontend
cd frontend

# ติดตั้ง Dependencies
npm install

# Start Development Server (localhost:3000)
npm run dev

# Build Production
npm run build

# Start Production Server
npm run start
```

---

## 📚 วิธี Export เป็น PDF

### Option 1: VS Code Extension
1. ติดตั้ง Extension: **"Markdown PDF"**
2. เปิดไฟล์ `PHASE4_FRONTEND_DOCS.md`
3. กด `Ctrl+Shift+P` → พิมพ์ "Markdown PDF: Export (pdf)"
4. ได้ไฟล์ PDF ออกมา

### Option 2: Online Converter
1. Copy เนื้อหาไปยัง https://dillinger.io/
2. กด Export → PDF

### Option 3: Pandoc (Command Line)
```bash
pandoc PHASE4_FRONTEND_DOCS.md -o PHASE4_FRONTEND_DOCS.pdf
```

---

*📘 Document Version: 1.0*  
*📅 Created: 2026-02-01*  
*🤖 Generated by Antigravity AI Assistant*
