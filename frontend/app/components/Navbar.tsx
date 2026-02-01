'use client';
/**
 * ===================================================================
 * Navbar.tsx - แถบเมนูด้านบน (Mobile-First + Multi-Language)
 * ===================================================================
 * 📱 Design Philosophy:
 *    - Mobile-First: ออกแบบสำหรับโทรศัพท์ก่อน แล้วขยายสำหรับ Desktop
 *    - ไม่เลื่อนซ้ายขวา: ทุกอย่างอยู่ในจอ
 *    - ปุ่มกระชับ: ใช้ Icon + ข้อความสั้น
 * 
 * 🔧 Components:
 *    1. Logo (ย่อเป็น MMRD บนมือถือ)
 *    2. Language Switcher (ธงชาติ)
 *    3. Theme Toggle (กลางวัน/กลางคืน)
 *    4. Auth Buttons (Login/Logout)
 * ===================================================================
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, languages } from '../context/LanguageContext';
import { cn } from '../lib/cn';
import { Sun, Moon, User, Wallet, LogOut, ChevronDown, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { lang, setLang, t, flag } = useLanguage();

    // === State Management ===
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    // === Auth State (เช็คจาก localStorage) ===
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    /**
     * เช็ค Token ตอนโหลดหน้า
     * ถ้ามี token แปลว่า login แล้ว
     */
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUsername = localStorage.getItem('username');
        if (token) {
            setIsLoggedIn(true);
            setUsername(savedUsername || 'User');
        }
    }, []);

    /**
     * ปิด Dropdown เมื่อคลิกข้างนอก
     */
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /**
     * ฟังก์ชัน Logout
     * ลบ token และ redirect ไปหน้าแรก
     */
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        router.refresh();
        router.push('/');
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 glass"
        >
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-12 sm:h-16">

                    {/* === LOGO === */}
                    {/* Mobile: แสดง MMRD | Desktop: แสดง MMRRDiKub เต็ม */}
                    <Link href="/">
                        <motion.div
                            className="flex items-center gap-1 sm:gap-2 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                        >
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                            <span className="text-base sm:text-xl font-bold text-gradient">
                                {/* Mobile: Short | Desktop: Full */}
                                <span className="sm:hidden">MMRD</span>
                                <span className="hidden sm:inline">MMRRDiKub</span>
                            </span>
                        </motion.div>
                    </Link>

                    {/* === RIGHT SIDE ACTIONS === */}
                    <div className="flex items-center gap-1 sm:gap-2">

                        {/* Dashboard Link - แสดงเฉพาะเมื่อ Login แล้ว */}
                        {isLoggedIn && (
                            <Link href="/dashboard" className="hidden sm:flex">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="px-2 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-accent/20 transition-all cursor-pointer flex items-center gap-1"
                                >
                                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden md:inline">{t('dashboard')}</span>
                                </motion.span>
                            </Link>
                        )}

                        {/* === Language Switcher (ธงชาติ) === */}
                        <div className="relative" ref={langRef}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className="flex items-center gap-0.5 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-sm transition-all hover:bg-accent/20"
                            >
                                <span className="text-base sm:text-lg">{flag}</span>
                                <ChevronDown className={cn(
                                    'w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform',
                                    showLangDropdown && 'rotate-180'
                                )} />
                            </motion.button>

                            {/* Desktop Dropdown */}
                            <AnimatePresence>
                                {showLangDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-36 sm:w-40 bg-[#161b22] rounded-xl border border-[#30363d] shadow-xl overflow-hidden z-50 hidden sm:block"
                                    >
                                        <div className="max-h-80 overflow-y-auto">
                                            {languages.map((l) => (
                                                <button
                                                    key={l.code}
                                                    onClick={() => {
                                                        setLang(l.code);
                                                        setShowLangDropdown(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent/20 transition-all text-sm',
                                                        lang === l.code && 'bg-accent/30 text-accent'
                                                    )}
                                                >
                                                    <span className="text-base">{l.flag}</span>
                                                    <span className="text-xs sm:text-sm">{l.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* === Theme Toggle === */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleTheme}
                            className="p-1.5 sm:p-2 rounded-lg transition-all hover:bg-accent/20"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                            )}
                        </motion.button>

                        {/* === Auth Buttons === */}
                        {isLoggedIn ? (
                            /* === Logged In: แสดง Avatar + Logout === */
                            <div className="flex items-center gap-1 sm:gap-2">
                                {/* User Avatar (Desktop only) */}
                                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg glass">
                                    <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center">
                                        <User className="w-2.5 h-2.5 text-accent" />
                                    </div>
                                    <span className="text-xs font-medium max-w-[60px] truncate">{username}</span>
                                </div>

                                {/* Dashboard (Mobile) */}
                                <Link href="/dashboard" className="sm:hidden">
                                    <span className="p-1.5 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4" />
                                    </span>
                                </Link>

                                {/* Logout Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-loss/20 text-loss hover:bg-loss/30 transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{t('logout')}</span>
                                </motion.button>
                            </div>
                        ) : (
                            /* === Not Logged In: แสดง Login === */
                            <div className="flex items-center gap-1">
                                {/* Register (Desktop only) */}
                                <Link href="/register" className="hidden sm:block">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-2 py-1 rounded-lg text-xs font-medium glass hover:bg-accent/20 transition-all cursor-pointer"
                                    >
                                        {t('register')}
                                    </motion.span>
                                </Link>

                                {/* Login Button */}
                                <Link href="/login">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-accent text-black cursor-pointer"
                                    >
                                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span>{t('login')}</span>
                                    </motion.span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === Mobile Language Grid (แสดงเมื่อกด ธงชาติ บนมือถือ) === */}
            <AnimatePresence>
                {showLangDropdown && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:hidden border-t border-[#30363d] bg-[#0d1117]"
                    >
                        <div className="grid grid-cols-5 gap-0.5 p-1.5">
                            {languages.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => {
                                        setLang(l.code);
                                        setShowLangDropdown(false);
                                    }}
                                    className={cn(
                                        'p-1.5 text-center rounded-lg hover:bg-accent/20 transition-all flex flex-col items-center',
                                        lang === l.code && 'bg-accent/30'
                                    )}
                                >
                                    <span className="text-lg">{l.flag}</span>
                                    <span className="text-[8px] text-gray-500 mt-0.5">{l.code.toUpperCase()}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
