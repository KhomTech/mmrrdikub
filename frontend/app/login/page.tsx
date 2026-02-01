'use client';
/**
 * Login Page - หน้าเข้าสู่ระบบ (Multi-Language + Mobile-Optimized)
 * ✅ รองรับ 10 ภาษา | ✅ Redirect Support | ✅ Mobile-First
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { authAPI } from '../utils/api';
import { ThemeProvider } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
    User,
    Lock,
    LogIn,
    Loader2,
    AlertCircle,
    Wallet,
    Eye,
    EyeOff,
    ArrowRight
} from 'lucide-react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    // State สำหรับ Form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Handle Submit พร้อม Redirect Support
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError(t('fillAllFields'));
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.login({ username, password });
            const { token, user } = response.data;

            // เก็บ Token
            localStorage.setItem('token', token);
            localStorage.setItem('username', user.username);

            // Redirect ไปหน้าที่เคยอยู่ (ถ้ามี redirect param)
            const redirectTo = searchParams.get('redirect') || '/';
            router.push(redirectTo);
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Username หรือ Password ไม่ถูกต้อง');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-profit/10 rounded-full blur-3xl" />
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-sm sm:max-w-md"
            >
                <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 border-2 border-accent/30">
                    {/* Logo */}
                    <div className="text-center mb-5 sm:mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-accent/20 flex items-center justify-center"
                        >
                            <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                        </motion.div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gradient">{t('login')}</h1>
                        <p className="text-muted text-xs sm:text-sm mt-1">{t('welcome')}!</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted">
                                <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base rounded-lg sm:rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent/20 transition-all"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
                                    ) : (
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-loss/20 text-loss text-xs sm:text-sm"
                            >
                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base bg-accent text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                    {t('saving')}
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                                    {t('login')}
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Links */}
                    <div className="text-center mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center text-xs sm:text-sm">
                            <span className="text-muted">No account?</span>
                            <Link href="/register" className="text-accent hover:underline flex items-center gap-1 font-medium">
                                {t('register')} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Link>
                        </div>
                        <Link href="/" className="text-xs sm:text-sm text-muted hover:text-accent transition-all block">
                            ← Back
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <ThemeProvider>
            <LoginContent />
        </ThemeProvider>
    );
}
