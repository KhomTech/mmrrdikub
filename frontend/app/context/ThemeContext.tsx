'use client';
/*
  ThemeContext.tsx - ระบบจัดการ Theme (มืด/สว่าง)
  เก็บ state ไว้ใน localStorage เพื่อจำค่าที่ผู้ใช้เลือก
*/

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// กำหนด type สำหรับ context - มี theme กับฟังก์ชันสลับ
type ThemeContextType = {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
};

// สร้าง Context เพื่อแชร์ theme ไปทั้งแอพ
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider ครอบแอพ - จัดการ logic theme ทั้งหมด
export function ThemeProvider({ children }: { children: ReactNode }) {
    // เริ่มต้นเป็น dark เพราะเราชอบธีมมืด
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    // โหลด theme จาก localStorage ตอนเปิดเว็บครั้งแรก
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        }
        setMounted(true);
    }, []);

    // อัพเดท class บน <html> และเซฟ localStorage ทุกครั้งที่ theme เปลี่ยน
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    // ฟังก์ชันสลับ theme - กดปุ่มแล้วสลับไปมา
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    // กัน hydration mismatch - รอจน mount เสร็จค่อยแสดง
    if (!mounted) {
        return <div className="min-h-screen bg-[#0a0a0a]" />;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook สำหรับใช้ theme ใน component อื่นๆ
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme ต้องใช้ภายใน ThemeProvider เท่านั้น');
    }
    return context;
}
