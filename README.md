# 🚀 MMRRDiKub - Trade Risk Management & Journal App

![Project Banner](https://via.placeholder.com/1200x400?text=MMRRDiKub+Trading+Journal) <!-- Replace with actual screenshot -->

**MMRRDiKub** is a full-stack financial technology application designed to help traders manage risk, calculate position sizes, and journal their trades effectively. Built with modern web technologies, it emphasizes performance, security, and user experience.

🔗 **Live Demo:** [https://mmrrdikub.vercel.app](https://mmrrdikub.vercel.app)  
🔗 **API Endpoint:** [https://mmrrdikub.onrender.com](https://mmrrdikub.onrender.com)

---

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Axios
- **Backend:** Go (Golang), Fiber Framework, GORM
- **Database:** PostgreSQL (Neon Cloud)
- **DevOps:** Docker (Multi-stage build), Render (Backend), Vercel (Frontend)

---

## ✨ Key Features

- **🛡️ Risk Management Calculator:** Calculate exact position sizes based on capital, risk percentage, and stop loss.
- **📊 Interactive Dashboard:** Visual trade history with Win/Loss ratio analysis.
- **🔐 Secure Authentication:** JWT-based login/register system with bcrypt password hashing.
- **🤖 Artificial Intelligence Insights:** AI scoring system for trade setups based on R:R (Risk:Reward) ratio.
- **📱 Responsive Design:** Fully optimized for desktop and mobile devices.
- **🌍 Production Ready:** Deployed on scalable cloud infrastructure with CI/CD capabilities.

---

## 🚀 Getting Started

### Prerequisites
- [Go 1.22+](https://go.dev/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) or [Docker](https://www.docker.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/KhomTech/mmrrdikub.git
cd mmrrdikub
```

### 2. Backend Setup (Go)
```bash
cd backend
cp .env.example .env
# Edit .env and add your Database URL
go mod download
go run cmd/api/main.go
```
*Server will start at `http://localhost:8080`*

### 3. Frontend Setup (Next.js)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
*Client will start at `http://localhost:3000`*

---

## 📂 Project Structure

```
mmrrdikub/
├── backend/            # Go Fiber Backend
│   ├── cmd/api/        # Entry point
│   ├── internal/       # Business logic & Handlers
│   └── pkg/            # Utilities (DB connection)
│
├── frontend/           # Next.js Frontend
│   ├── app/            # App Router pages
│   ├── components/     # Reusable UI components
│   └── utils/          # Helper functions & API calls
│
└── database/           # SQL Migrations & Seeds
```

---

## 👨‍💻 Author

**Akkaraphon (KhomTech)**  
📧 [akkaraphon7tech@gmail.com](mailto:akkaraphon7tech@gmail.com)  
💼 *Open for Internship Opportunities (Software Engineer)*

---

Made with 💚 and lots of ☕ using Go & Next.js
