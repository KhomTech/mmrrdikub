'use client';
/**
 * Register Page - หน้าสมัครสมาชิก (Multi-Language + Mobile-Optimized)
 * ✅ รองรับ 10 ภาษา | ✅ Mobile-First | ✅ Redirect Support
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { authAPI } from '../utils/api';
import { cn } from '../lib/cn';
import { ThemeProvider } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
    User,
    Lock,
    Loader2,
    AlertCircle,
    Wallet,
    UserPlus,
    Check,
    ArrowRight,
    Eye,
    EyeOff,
    WifiOff,
    Mail
} from 'lucide-react';

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    // Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isNetworkError, setIsNetworkError] = useState(false);

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsNetworkError(false);

        // Validate
        if (!username || username.length < 3) {
            setError('Username ≥ 3 chars');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError('Invalid email');
            return;
        }
        if (!password || password.length < 6) {
            setError('Password ≥ 6 chars');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authAPI.register({ username, email, password });
            setSuccess(true);

            // Redirect to login with redirect param
            const redirectTo = searchParams.get('redirect');
            setTimeout(() => {
                router.push(redirectTo ? `/login?redirect=${redirectTo}` : '/login');
            }, 2000);

        } catch (err: any) {
            if (!err.response) {
                setIsNetworkError(true);
                setError('Network Error');
            } else {
                setError(err.response.data?.error || 'Error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-profit/10 rounded-full blur-3xl" />
            </div>

            {/* Card */}
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
                        <h1 className="text-xl sm:text-2xl font-bold text-gradient">{t('register')}</h1>
                        <p className="text-muted text-xs sm:text-sm mt-1">Create Account</p>
                    </div>

                    {/* Success */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6 sm:py-8"
                        >
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-profit/20 flex items-center justify-center">
                                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-profit" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-profit mb-2">{t('savedSuccess')} 🎉</h2>
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto text-accent" />
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="3+ chars"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl glass border border-glass-border focus:border-accent outline-none"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted">
                                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl glass border border-glass-border focus:border-accent outline-none"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted">
                                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="6+ chars"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base rounded-lg sm:rounded-xl glass border border-glass-border focus:border-accent outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4 text-muted" /> : <Eye className="w-4 h-4 text-muted" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-muted">
                                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Confirm
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm"
                                        className={cn(
                                            "w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base rounded-lg sm:rounded-xl glass border outline-none",
                                            confirmPassword && password !== confirmPassword
                                                ? "border-loss" : "border-glass-border focus:border-accent"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-muted" /> : <Eye className="w-4 h-4 text-muted" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex items-center gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm",
                                        isNetworkError ? "bg-yellow-500/20 text-yellow-400" : "bg-loss/20 text-loss"
                                    )}
                                >
                                    {isNetworkError ? <WifiOff className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Submit */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                                className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base bg-accent text-white flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> {t('saving')}</>
                                ) : (
                                    <><UserPlus className="w-4 h-4 sm:w-5 sm:h-5" /> {t('register')}</>
                                )}
                            </motion.button>
                        </form>
                    )}

                    {/* Links */}
                    {!success && (
                        <div className="text-center mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-1.5 sm:gap-2 justify-center text-xs sm:text-sm">
                                <span className="text-muted">Have account?</span>
                                <Link href="/login" className="text-accent hover:underline flex items-center gap-1 font-medium">
                                    {t('login')} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Link>
                            </div>
                            <Link href="/" className="text-xs sm:text-sm text-muted hover:text-accent transition-all block">
                                ← Back
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <ThemeProvider>
            <RegisterContent />
        </ThemeProvider>
    );
}
