/*
  layout.tsx - Root Layout ของแอพ
  ใส่ Font, ThemeProvider, LanguageProvider และ metadata
*/

import type { Metadata } from "next";
import { Inter, Kanit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./context/ThemeContext";

// Font หลัก - Inter สำหรับภาษาอังกฤษ (ดูทันสมัย อ่านง่าย)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Font รอง - Kanit สำหรับภาษาไทย (สวย อ่านง่าย)
const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Metadata สำหรับ SEO
export const metadata: Metadata = {
  title: "MMRRDiKub | Trading Journal Pro",
  description: "เครื่องมือคำนวณ Position Size และจดบันทึกการเทรดระดับมืออาชีพ พร้อมระบบ AI วิเคราะห์พฤติกรรมการเทรด",
  keywords: ["trading journal", "position size calculator", "crypto trading", "risk management"],
};

// Layout หลัก - ครอบทุกหน้าในแอพ
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className={`${inter.variable} ${kanit.variable} font-sans antialiased`}>
        {/* ThemeProvider ครอบทุกอย่าง */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
