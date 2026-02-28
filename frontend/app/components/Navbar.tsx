'use client';
/**
 * Navbar.tsx - แถบเมนู Mobile-First + 30 Languages + Country Search
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, languages } from '../context/LanguageContext';
import { cn } from '../lib/cn';
import { User, Wallet, LogOut, ChevronDown, BarChart3, Search, X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const router = useRouter();
    const { theme } = useTheme();
    const { lang, setLang, t, flag } = useLanguage();

    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [langSearch, setLangSearch] = useState('');
    const langRef = useRef<HTMLDivElement>(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUsername = localStorage.getItem('username');
        if (token) {
            setIsLoggedIn(true);
            setUsername(savedUsername || 'User');
        }
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        router.refresh();
        router.push('/');
    };

    // Filter languages by search
    const filteredLangs = languages.filter(l =>
        l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
        l.code.toLowerCase().includes(langSearch.toLowerCase())
    );

    // Group by tier
    const tier1 = filteredLangs.filter(l => l.tier === 1);
    const tier2 = filteredLangs.filter(l => l.tier === 2);
    const tier3 = filteredLangs.filter(l => l.tier === 3);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
                'fixed top-0 left-0 right-0 z-50',
                theme === 'dark' ? 'glass' : 'bg-white/90 backdrop-blur-md border-b border-gray-200'
            )}
        >
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-12 sm:h-16">

                    {/* Logo */}
                    <Link href="/">
                        <motion.div className="flex items-center gap-1 sm:gap-2 cursor-pointer" whileHover={{ scale: 1.02 }}>
                            <Wallet className={cn('w-5 h-5 sm:w-6 sm:h-6', theme === 'dark' ? 'text-accent' : 'text-emerald-600')} />
                            <span className={cn('text-base sm:text-xl font-bold', theme === 'dark' ? 'text-gradient' : 'text-gray-900')}>
                                <span className="sm:hidden">MMRD</span>
                                <span className="hidden sm:inline">MMRRDiKub</span>
                            </span>
                        </motion.div>
                    </Link>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">

                        {/* Dashboard Link */}
                        {isLoggedIn && (
                            <Link href="/dashboard" className="hidden sm:flex">
                                <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className={cn(
                                        'px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1',
                                        theme === 'dark' ? 'hover:bg-accent/20' : 'hover:bg-emerald-50 text-gray-700'
                                    )}
                                >
                                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden md:inline">{t('dashboard')}</span>
                                </motion.span>
                            </Link>
                        )}

                        {/* Language Switcher */}
                        <div className="relative" ref={langRef}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className={cn(
                                    'flex items-center gap-0.5 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-lg text-sm transition-all',
                                    theme === 'dark' ? 'hover:bg-accent/20' : 'hover:bg-gray-100'
                                )}
                            >
                                <span className="text-base sm:text-lg">{flag}</span>
                                <ChevronDown className={cn('w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform', showLangDropdown && 'rotate-180')} />
                            </motion.button>

                            <AnimatePresence>
                                {showLangDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className={cn(
                                            'absolute right-0 mt-2 w-64 sm:w-72 rounded-xl border shadow-xl overflow-hidden z-50',
                                            theme === 'dark' ? 'bg-[var(--surface)] border-[var(--border)]' : 'bg-white border-gray-200'
                                        )}
                                    >
                                        {/* Search */}
                                        <div className={cn('p-2 border-b', theme === 'dark' ? 'border-[var(--border)]' : 'border-gray-200')}>
                                            <div className="relative">
                                                <Search className={cn('absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
                                                <input
                                                    type="text"
                                                    value={langSearch}
                                                    onChange={(e) => setLangSearch(e.target.value)}
                                                    placeholder={t('searchLanguage')}
                                                    className={cn(
                                                        'w-full pl-7 pr-7 py-1.5 rounded-lg text-sm outline-none',
                                                        theme === 'dark' ? 'bg-[var(--background)] border border-[var(--border)] text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                                                    )}
                                                />
                                                {langSearch && (
                                                    <button
                                                        onClick={() => setLangSearch('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Language List */}
                                        <div className="max-h-80 overflow-y-auto">
                                            {tier1.length > 0 && (
                                                <>
                                                    <div className={cn('px-3 py-1.5 text-xs font-medium', theme === 'dark' ? 'bg-[var(--background)] text-gray-500' : 'bg-gray-50 text-gray-500')}>
                                                        🌏 {t('tier1')}
                                                    </div>
                                                    {tier1.map(l => (
                                                        <button
                                                            key={l.code}
                                                            onClick={() => { setLang(l.code); setShowLangDropdown(false); setLangSearch(''); }}
                                                            className={cn(
                                                                'w-full px-3 py-2 text-left flex items-center gap-2 transition-all text-sm',
                                                                theme === 'dark' ? 'hover:bg-accent/20' : 'hover:bg-emerald-50',
                                                                lang === l.code && (theme === 'dark' ? 'bg-accent/30 text-accent' : 'bg-emerald-100 text-emerald-600')
                                                            )}
                                                        >
                                                            <span className="text-base">{l.flag}</span>
                                                            <span className={theme === 'dark' ? '' : 'text-gray-900'}>{l.name}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {tier2.length > 0 && (
                                                <>
                                                    <div className={cn('px-3 py-1.5 text-xs font-medium', theme === 'dark' ? 'bg-[var(--background)] text-gray-500' : 'bg-gray-50 text-gray-500')}>
                                                        🌍 {t('tier2')}
                                                    </div>
                                                    {tier2.map(l => (
                                                        <button
                                                            key={l.code}
                                                            onClick={() => { setLang(l.code); setShowLangDropdown(false); setLangSearch(''); }}
                                                            className={cn(
                                                                'w-full px-3 py-2 text-left flex items-center gap-2 transition-all text-sm',
                                                                theme === 'dark' ? 'hover:bg-accent/20' : 'hover:bg-emerald-50',
                                                                lang === l.code && (theme === 'dark' ? 'bg-accent/30 text-accent' : 'bg-emerald-100 text-emerald-600')
                                                            )}
                                                        >
                                                            <span className="text-base">{l.flag}</span>
                                                            <span className={theme === 'dark' ? '' : 'text-gray-900'}>{l.name}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {tier3.length > 0 && (
                                                <>
                                                    <div className={cn('px-3 py-1.5 text-xs font-medium', theme === 'dark' ? 'bg-[var(--background)] text-gray-500' : 'bg-gray-50 text-gray-500')}>
                                                        🇪🇺 {t('tier3')}
                                                    </div>
                                                    {tier3.map(l => (
                                                        <button
                                                            key={l.code}
                                                            onClick={() => { setLang(l.code); setShowLangDropdown(false); setLangSearch(''); }}
                                                            className={cn(
                                                                'w-full px-3 py-2 text-left flex items-center gap-2 transition-all text-sm',
                                                                theme === 'dark' ? 'hover:bg-accent/20' : 'hover:bg-emerald-50',
                                                                lang === l.code && (theme === 'dark' ? 'bg-accent/30 text-accent' : 'bg-emerald-100 text-emerald-600')
                                                            )}
                                                        >
                                                            <span className="text-base">{l.flag}</span>
                                                            <span className={theme === 'dark' ? '' : 'text-gray-900'}>{l.name}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Auth Buttons */}
                        {isLoggedIn ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className={cn(
                                    'hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg',
                                    theme === 'dark' ? 'glass' : 'bg-gray-100'
                                )}>
                                    <div className={cn(
                                        'w-5 h-5 rounded-full flex items-center justify-center',
                                        theme === 'dark' ? 'bg-accent/30' : 'bg-emerald-100'
                                    )}>
                                        <User className={cn('w-2.5 h-2.5', theme === 'dark' ? 'text-accent' : 'text-emerald-600')} />
                                    </div>
                                    <span className={cn('text-xs font-medium max-w-[60px] truncate', theme === 'dark' ? '' : 'text-gray-700')}>
                                        {username}
                                    </span>
                                </div>

                                <Link href="/dashboard" className="sm:hidden">
                                    <span className={cn(
                                        'p-1.5 rounded-lg flex items-center justify-center',
                                        theme === 'dark' ? 'bg-accent/20 text-accent' : 'bg-emerald-100 text-emerald-600'
                                    )}>
                                        <BarChart3 className="w-4 h-4" />
                                    </span>
                                </Link>

                                <Link href="/forgot-password">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-all"
                                    >
                                        <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden lg:inline">เปลี่ยนรหัส</span>
                                    </motion.button>
                                </Link>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">{t('logout')}</span>
                                </motion.button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Link href="/register" className="hidden sm:block">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            'px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                                            theme === 'dark' ? 'glass hover:bg-accent/20' : 'bg-gray-100 hover:bg-emerald-50 text-gray-700'
                                        )}
                                    >
                                        {t('register')}
                                    </motion.span>
                                </Link>

                                <Link href="/login">
                                    <motion.span
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            'flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold cursor-pointer',
                                            theme === 'dark' ? 'bg-accent text-black' : 'bg-emerald-600 text-white'
                                        )}
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
        </motion.nav>
    );
}
