# ☁️ Phase 6: ขึ้นเว็บจริง (Go Live)
## MMRRDiKub Trading Journal - Production Deployment Guide

**🗓️ วันที่สร้าง:** 2026-02-01  
**🎯 เป้าหมาย:** มีลิงก์เว็บที่ใช้ได้ทั่วโลก พร้อมโดเมนฟรี  
**🔐 ความปลอดภัย:** ไม่โชว์ Secret Keys ใน GitHub

---

# 📋 สรุปสิ่งที่ต้องทำ

| ขั้นตอน | Platform | Free | ผลลัพธ์ |
|---------|----------|------|---------|
| 1. Database | Neon | ✅ | PostgreSQL URL |
| 2. Backend | Render | ✅ | `https://xxx.onrender.com` |
| 3. Frontend | Vercel | ✅ | `https://xxx.vercel.app` |
| 4. GitHub | GitHub | ✅ | Repository สำหรับ Deploy |

---

# 🔐 ความปลอดภัย: ป้องกัน Secrets หลุด

> [!CAUTION]
> **ห้ามทำ!** Push ไฟล์ที่มี Password, API Key, JWT Secret ขึ้น GitHub

### ไฟล์ที่ต้องไม่ Push:
```
.env              # ❌ มี Database Password!
.env.local        # ❌ มี API Keys!
.env.production   # ❌ มี JWT Secret!
```

### ไฟล์ที่ Push ได้:
```
.env.example      # ✅ แค่ Template ไม่มีค่าจริง
.gitignore        # ✅ บอกว่าไฟล์ไหนไม่ Push
```

### วิธีเช็คว่าปลอดภัย:
```bash
# ก่อน Push ทุกครั้ง ให้เช็คว่า .env ไม่ติดไป
git status

# ถ้าเห็น .env ให้ลบออกจาก staging
git reset .env
```

---

# 🗄️ ขั้นตอนที่ 1: ตั้งค่า Database (Neon)

### 1.1 สมัคร Neon (ฟรี)
1. ไปที่ https://neon.tech
2. กด **Sign Up** (ใช้ GitHub/Google ได้)
3. สร้าง Project ใหม่ ชื่อ `mmrrdikub`
4. เลือก Region: **Singapore** (ใกล้ไทย)

### 1.2 Copy Database URL
```
postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> [!IMPORTANT]
> **เก็บ URL นี้ไว้!** จะใช้ใน Render

### 1.3 รัน SQL Schema
1. ไปที่ **SQL Editor** ใน Neon Dashboard
2. Copy เนื้อหาจาก `database/schema.sql`
3. รัน SQL

---

# 🚀 ขั้นตอนที่ 2: Deploy Backend (Render)

### 2.1 Push Code ขึ้น GitHub

```bash
# สร้าง Repository ใหม่บน GitHub แล้ว

cd c:\Users\Akkaraphon\Desktop\mmrrdikub

# เริ่มต้น Git (ถ้ายังไม่มี)
git init

# เพิ่มไฟล์ทั้งหมด (ยกเว้น .env เพราะมี .gitignore)
git add .

# Commit
git commit -m "Initial commit: MMRRDiKub Trading Journal"

# เชื่อม Remote
git remote add origin https://github.com/YOUR_USERNAME/mmrrdikub.git

# Push
git branch -M main
git push -u origin main
```

### 2.2 สมัคร Render (ฟรี)
1. ไปที่ https://render.com
2. กด **Sign Up** (ใช้ GitHub)
3. เลือก **New > Web Service**

### 2.3 เชื่อม GitHub Repository
1. เลือก Repository: `mmrrdikub`
2. ตั้งค่า:

| Setting | Value |
|---------|-------|
| Name | `mmrrdikub-api` |
| Region | `Singapore` |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Docker` |
| Instance Type | `Free` |

### 2.4 ตั้งค่า Environment Variables

> [!WARNING]
> **ใส่ใน Render Dashboard เท่านั้น!** ห้ามใส่ใน Code!

| Key | Value | ที่มา |
|-----|-------|-------|
| `DB_URL` | `postgresql://...` | จาก Neon |
| `JWT_SECRET` | `random-string-32-chars` | สร้างใหม่! |
| `PORT` | `8080` | Default |

### 2.5 วิธีสร้าง JWT Secret ที่ปลอดภัย:
```bash
# Windows PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# หรือใช้ Online Generator
# https://generate-secret.vercel.app/32
```

### 2.6 Deploy!
1. กด **Create Web Service**
2. รอ Build (~5 นาที)
3. จะได้ URL: `https://mmrrdikub-api.onrender.com`

### 2.7 ทดสอบ Backend:
```bash
# เปิด Browser ไปที่
https://mmrrdikub-api.onrender.com/health

# ควรเห็น
{"status": "ok"}
```

---

# 🌐 ขั้นตอนที่ 3: Deploy Frontend (Vercel)

### 3.1 สมัคร Vercel (ฟรี)
1. ไปที่ https://vercel.com
2. กด **Sign Up** (ใช้ GitHub)
3. เลือก **Import Project**

### 3.2 เชื่อม GitHub Repository
1. เลือก Repository: `mmrrdikub`
2. ตั้งค่า:

| Setting | Value |
|---------|-------|
| Project Name | `mmrrdikub` |
| Framework | `Next.js` (Auto-detect) |
| Root Directory | `frontend` |

### 3.3 ตั้งค่า Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://mmrrdikub-api.onrender.com/api` |

> [!IMPORTANT]
> ต้องใส่ `/api` ต่อท้าย URL!

### 3.4 Deploy!
1. กด **Deploy**
2. รอ Build (~2 นาที)
3. จะได้ URL: `https://mmrrdikub.vercel.app`

---

# ✅ ขั้นตอนที่ 4: ทดสอบ Production

### 4.1 ทดสอบทีละส่วน:

```
1. Backend Health Check:
   https://mmrrdikub-api.onrender.com/health
   ✅ ควรเห็น: {"status": "ok"}

2. Frontend:
   https://mmrrdikub.vercel.app
   ✅ ควรเห็น: หน้าเว็บ Calculator

3. Register:
   - กรอก Username, Email, Password
   - ✅ ควร: "สมัครสมาชิกสำเร็จ"

4. Login:
   - ใช้ Username + Password ที่สมัคร
   - ✅ ควร: Redirect ไป Dashboard

5. Create Trade:
   - กรอกข้อมูลใน Calculator
   - กด Save
   - ✅ ควร: บันทึกสำเร็จ

6. View History:
   - ไปหน้า Dashboard
   - ✅ ควร: เห็น Trade ที่บันทึก
```

---

# 📁 โครงสร้างไฟล์ที่สร้างใหม่

```
mmrrdikub/
├── backend/
│   ├── Dockerfile          # 🐳 Multi-stage build
│   ├── .gitignore          # 🔐 ป้องกัน .env หลุด
│   ├── .env.example        # 📝 Template
│   └── ...
│
├── frontend/
│   ├── vercel.json         # ⚙️ Vercel Config
│   ├── .gitignore          # 🔐 ป้องกัน .env หลุด
│   ├── .env.example        # 📝 Template
│   └── ...
│
├── render.yaml             # ⚙️ Render Blueprint
└── docs/
    └── PHASE6_DEPLOYMENT.md  # 📘 เอกสารนี้
```

---

# 🐳 อธิบาย Dockerfile (Multi-stage Build)

```dockerfile
# ╔════════════════════════════════════════╗
# ║  STAGE 1: BUILD                        ║
# ║  Image ใหญ่ ~800MB มี Go Compiler      ║
# ╚════════════════════════════════════════╝
FROM golang:1.22-alpine AS builder

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/

# ╔════════════════════════════════════════╗
# ║  STAGE 2: RUNTIME                      ║
# ║  Image เล็ก ~20MB มีแค่ Binary         ║
# ╚════════════════════════════════════════╝
FROM alpine:3.19

# Copy binary จาก Stage 1
COPY --from=builder /app/main .

# Run
CMD ["./main"]
```

**ทำไมต้อง Multi-stage?**
| เปรียบเทียบ | Single Stage | Multi-stage |
|-------------|--------------|-------------|
| Image Size | ~800MB | ~20MB |
| Build Time | ช้า | เร็ว (cache) |
| Security | มี Tools | มีแค่ Binary |

---

# 🔄 Auto Deploy (CI/CD)

เมื่อ Push code ขึ้น GitHub:
1. **Render** จะ Build Backend ใหม่อัตโนมัติ
2. **Vercel** จะ Build Frontend ใหม่อัตโนมัติ

```
┌─────────────┐     git push     ┌─────────────┐
│   VS Code   │ ───────────────▶ │   GitHub    │
│   (Local)   │                  │   (Remote)  │
└─────────────┘                  └──────┬──────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                        ▼                               ▼
                 ┌─────────────┐                ┌─────────────┐
                 │   Render    │                │   Vercel    │
                 │  (Backend)  │                │ (Frontend)  │
                 │  Auto Build │                │  Auto Build │
                 └─────────────┘                └─────────────┘
                        │                               │
                        ▼                               ▼
                 ┌─────────────┐                ┌─────────────┐
                 │ https://    │                │ https://    │
                 │ xxx.onrender│                │ xxx.vercel  │
                 │ .com        │                │ .app        │
                 └─────────────┘                └─────────────┘
```

---

# ⚠️ Troubleshooting

### ปัญหา: Backend Build Failed
```
Error: cannot find package "mmrrdikub/..."
```
**แก้:** ตรวจสอบ `go.mod` ว่า module name ถูกต้อง

### ปัญหา: Database Connection Failed
```
Error: connection refused
```
**แก้:** ตรวจสอบ `DB_URL` ใน Render Environment Variables

### ปัญหา: CORS Error ใน Production
```
Access-Control-Allow-Origin
```
**แก้:** เพิ่ม Frontend URL ใน CORS Config:
```go
// main.go
AllowOriginsFunc: func(origin string) bool {
    return origin == "https://mmrrdikub.vercel.app" ||
           origin == "http://localhost:3000"
}
```

### ปัญหา: Render Free Tier Sleep
**อาการ:** เว็บโหลดช้ามาก (30 วินาที)  
**สาเหตุ:** Render Free Tier จะ Sleep ถ้าไม่มีคนใช้ 15 นาที  
**แก้:** Upgrade หรือใช้ Cron Job ping ทุก 14 นาที

---

# 🎉 ผลลัพธ์สุดท้าย

เมื่อทำครบทุกขั้นตอน จะได้:

| Service | URL | ใช้งาน |
|---------|-----|--------|
| **Frontend** | `https://mmrrdikub.vercel.app` | 🌐 เว็บหลัก |
| **Backend** | `https://mmrrdikub-api.onrender.com` | 🔌 API |
| **Database** | Neon (private) | 🗄️ เก็บข้อมูล |

**ส่งงาน:** ส่งลิงก์ `https://mmrrdikub.vercel.app` 🎉

---

# 📝 Checklist ก่อน Deploy

- [ ] สร้าง `.gitignore` แล้ว (Backend + Frontend)
- [ ] สร้าง `.env.example` แล้ว
- [ ] **ไม่มี** `.env` ใน Git (`git status` เช็ค)
- [ ] Dockerfile ทดสอบ Build ผ่าน
- [ ] Database Schema รันแล้ว
- [ ] Environment Variables ใส่ใน Render/Vercel แล้ว
- [ ] ทดสอบ Register/Login/Save Trade ผ่าน

---

*📘 Document Version: 1.0*  
*📅 Created: 2026-02-01*  
*🤖 Generated by Antigravity AI Assistant*
