'use client';
/*
  Navbar.tsx - แถบเมนูด้านบน (Connected to Real Auth)
  เช็ค Token จาก localStorage เพื่อแสดงสถานะ Login
*/

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';
import { Sun, Moon, Globe, User, Wallet, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

// === ระบบภาษา ===
const translations = {
    th: {
        login: 'เข้าสู่ระบบ',
        register: 'สมัครสมาชิก',
        logout: 'ออกจากระบบ',
        dashboard: 'ประวัติเทรด',
    },
    en: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        dashboard: 'Trade History',
    },
};

type Lang = 'th' | 'en';

export default function Navbar() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    // State สำหรับภาษา
    const [lang, setLang] = useState<Lang>('th');

    // State สำหรับ Login - เช็คจาก Token ใน localStorage
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    // เช็ค Token ตอนโหลดหน้า
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUsername = localStorage.getItem('username');

        if (token) {
            setIsLoggedIn(true);
            setUsername(savedUsername || 'User');
        }
    }, []);

    // ฟังก์ชัน Logout - ลบ Token แล้ว Refresh
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        router.refresh();
        router.push('/');
    };

    // สลับภาษา
    const toggleLang = () => setLang((prev) => (prev === 'th' ? 'en' : 'th'));
    const t = translations[lang];

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 glass"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/">
                        <motion.div
                            className="flex items-center gap-2 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                        >
                            <Wallet className="w-7 h-7 text-accent" />
                            <span className="text-2xl font-bold text-gradient">
                                MMRRDiKub
                            </span>
                        </motion.div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-3">

                        {/* Dashboard Link - แสดงเฉพาะเมื่อ Login แล้ว */}
                        {isLoggedIn && (
                            <Link href="/dashboard">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium hover:bg-accent/20 transition-all cursor-pointer"
                                >
                                    {t.dashboard}
                                </motion.span>
                            </Link>
                        )}

                        {/* Theme Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className="p-2 rounded-full transition-all hover:bg-accent/20"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-700" />
                            )}
                        </motion.button>

                        {/* Language Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleLang}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-accent/20"
                        >
                            <Globe className="w-4 h-4" />
                            <span>{lang.toUpperCase()}</span>
                        </motion.button>

                        {/* Login/Logout */}
                        {isLoggedIn ? (
                            // ถ้า Login แล้ว - แสดงชื่อ + ปุ่ม Logout
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
                                        <User className="w-3 h-3 text-accent" />
                                    </div>
                                    <span className="text-sm font-medium">{username}</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-loss/20 text-loss hover:bg-loss/30 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{t.logout}</span>
                                </motion.button>
                            </div>
                        ) : (
                            // ถ้ายังไม่ Login - แสดงปุ่ม Register + Login
                            <div className="flex items-center gap-2">
                                <Link href="/register">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-4 py-2 rounded-full text-sm font-medium glass hover:bg-accent/20 transition-all cursor-pointer"
                                    >
                                        {t.register}
                                    </motion.span>
                                </Link>
                                <Link href="/login">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn-primary flex items-center gap-2 cursor-pointer"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>{t.login}</span>
                                    </motion.span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
