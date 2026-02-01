'use client';
/**
 * Navbar.tsx - แถบเมนูด้านบน (Mobile-Optimized + Multi-Language)
 * ✅ รองรับ 10 ภาษา | ✅ Mobile-First Design | ✅ Flag Dropdown
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, languages } from '../context/LanguageContext';
import { cn } from '../lib/cn';
import { Sun, Moon, User, Wallet, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const { lang, setLang, t, flag } = useLanguage();

    // Dropdown States
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    // Login State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    // Check Token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUsername = localStorage.getItem('username');
        if (token) {
            setIsLoggedIn(true);
            setUsername(savedUsername || 'User');
        }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Logout Handler
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
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">

                    {/* Logo - ย่อขนาดบนมือถือ */}
                    <Link href="/">
                        <motion.div
                            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                        >
                            <Wallet className="w-5 h-5 sm:w-7 sm:h-7 text-accent" />
                            <span className="text-lg sm:text-2xl font-bold text-gradient">
                                MMRD
                                <span className="hidden sm:inline">iKub</span>
                            </span>
                        </motion.div>
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-2">
                        {/* Dashboard Link */}
                        {isLoggedIn && (
                            <Link href="/dashboard">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium hover:bg-accent/20 transition-all cursor-pointer"
                                >
                                    {t('dashboard')}
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

                        {/* Language Dropdown */}
                        <div className="relative" ref={langRef}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-full text-sm transition-all hover:bg-accent/20"
                            >
                                <span className="text-lg">{flag}</span>
                                <ChevronDown className={cn(
                                    'w-3 h-3 transition-transform',
                                    showLangDropdown && 'rotate-180'
                                )} />
                            </motion.button>

                            <AnimatePresence>
                                {showLangDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-40 bg-[#161b22] rounded-xl border border-[#30363d] shadow-xl overflow-hidden z-50"
                                    >
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
                                                <span className="text-lg">{l.flag}</span>
                                                <span>{l.name}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Auth Buttons */}
                        {isLoggedIn ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                                    <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center">
                                        <User className="w-3 h-3 text-accent" />
                                    </div>
                                    <span className="text-sm font-medium max-w-[80px] truncate">{username}</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-loss/20 text-loss hover:bg-loss/30 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden md:inline">{t('logout')}</span>
                                </motion.button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/register">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-3 py-1.5 rounded-full text-sm font-medium glass hover:bg-accent/20 transition-all cursor-pointer"
                                    >
                                        {t('register')}
                                    </motion.span>
                                </Link>
                                <Link href="/login">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>{t('login')}</span>
                                    </motion.span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex sm:hidden items-center gap-1">
                        {/* Lang Switcher (Compact) */}
                        <button
                            onClick={() => setShowLangDropdown(!showLangDropdown)}
                            className="p-1.5 rounded-full hover:bg-accent/20"
                        >
                            <span className="text-lg">{flag}</span>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-full hover:bg-accent/20"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-4 h-4 text-yellow-400" />
                            ) : (
                                <Moon className="w-4 h-4 text-slate-700" />
                            )}
                        </button>

                        {/* Auth Buttons (Compact) */}
                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="p-1.5 rounded-full bg-loss/20 text-loss"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        ) : (
                            <Link href="/login">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-accent text-black">
                                    {t('login')}
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Language Dropdown (Shared) */}
            <AnimatePresence>
                {showLangDropdown && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:hidden border-t border-[#30363d] bg-[#0d1117]"
                    >
                        <div className="grid grid-cols-5 gap-1 p-2">
                            {languages.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => {
                                        setLang(l.code);
                                        setShowLangDropdown(false);
                                    }}
                                    className={cn(
                                        'p-2 text-center rounded-lg hover:bg-accent/20 transition-all',
                                        lang === l.code && 'bg-accent/30'
                                    )}
                                >
                                    <span className="text-xl">{l.flag}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
