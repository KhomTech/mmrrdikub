# ============================================
# Dockerfile for Go Fiber Backend
# Multi-stage build for smaller image size
# ============================================

# ╔════════════════════════════════════════╗
# ║        STAGE 1: BUILD (ใหญ่)           ║
# ╠════════════════════════════════════════╣
# ║  - ติดตั้ง Go Compiler                 ║
# ║  - Download Dependencies               ║
# ║  - Compile เป็น Binary                 ║
# ╚════════════════════════════════════════╝

FROM golang:1.22-alpine AS builder

# ติดตั้ง Git (บาง package ต้องใช้)
RUN apk add --no-cache git

# กำหนด Working Directory
WORKDIR /app

# Copy go.mod และ go.sum ก่อน (เพื่อ cache dependencies)
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code ทั้งหมด
COPY . .

# Build binary
# CGO_ENABLED=0 = ไม่ใช้ C libraries (ทำให้ binary เล็กลง)
# GOOS=linux = build สำหรับ Linux
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/

# ╔════════════════════════════════════════╗
# ║      STAGE 2: RUNTIME (เล็กมาก)        ║
# ╠════════════════════════════════════════╣
# ║  - Image เล็ก ~10MB                    ║
# ║  - มีแค่ Binary ที่ต้องใช้              ║
# ║  - ปลอดภัยกว่า (ไม่มี tools)           ║
# ╚════════════════════════════════════════╝

FROM alpine:3.19

# ติดตั้ง CA certificates (สำหรับ HTTPS)
RUN apk --no-cache add ca-certificates tzdata

# กำหนด Timezone
ENV TZ=Asia/Bangkok

# สร้าง user ไม่ใช่ root (security best practice)
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# กำหนด Working Directory
WORKDIR /app

# Copy binary จาก builder stage
COPY --from=builder /app/main .

# เปลี่ยน ownership เป็น appuser
RUN chown -R appuser:appgroup /app

# ใช้ user ที่ไม่ใช่ root
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run binary
CMD ["./main"]
