'use client';
/**
 * Register Page - หน้าสมัครสมาชิก
 * 🔥 FIX: เพิ่ม Debug Logging และ Error Handling ที่ชัดเจน
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { authAPI } from '../utils/api';
import { cn } from '../lib/cn';
import { ThemeProvider } from '../context/ThemeContext';
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

    // State สำหรับ Form
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // State สำหรับ Toggle Password Visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State สำหรับ Network Error
    const [isNetworkError, setIsNetworkError] = useState(false);

    // === Handle Submit ===
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 🔥 DEBUG: Log เมื่อเริ่ม Submit
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 REGISTER FORM SUBMITTED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Username:', username);
        console.log('📧 Email:', email);
        console.log('🔑 Password length:', password.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Reset Error State
        setError('');
        setIsNetworkError(false);

        // Validate Username
        if (!username || username.length < 3) {
            setError('Username ต้องมีอย่างน้อย 3 ตัวอักษร');
            console.warn('❌ Validation failed: Username too short');
            return;
        }

        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError('Email ไม่ถูกต้อง');
            console.warn('❌ Validation failed: Invalid email');
            return;
        }

        // Validate Password
        if (!password || password.length < 6) {
            setError('Password ต้องมีอย่างน้อย 6 ตัวอักษร');
            console.warn('❌ Validation failed: Password too short');
            return;
        }

        // Validate Confirm Password
        if (password !== confirmPassword) {
            setError('Password ไม่ตรงกัน');
            console.warn('❌ Validation failed: Passwords do not match');
            return;
        }

        console.log('✅ Validation passed, sending to API...');
        setLoading(true);

        try {
            // 🔥 เรียก API Register
            const response = await authAPI.register({ username, email, password });

            console.log('✅ Registration successful:', response.data);

            // สมัครสำเร็จ!
            setSuccess(true);

            // Redirect ไป Login หลัง 2 วินาที
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err: any) {
            console.error('❌ Registration failed:', err);

            // 🔥 FIX: แยก Error ให้ชัดเจน
            if (!err.response) {
                // Network Error - Backend ไม่ตอบ
                setIsNetworkError(true);
                setError('Network Error: ไม่สามารถเชื่อมต่อ Backend ได้');
                console.error('🔥 NETWORK ERROR - Backend unreachable!');
            } else {
                // Backend ตอบกลับมา แต่เป็น Error
                const backendMessage = err.response.data?.error || err.response.data?.message;
                setError(backendMessage || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
                console.error('📩 Backend Error:', backendMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />
            </div>

            {/* Register Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md"
            >
                <div className="glass rounded-3xl p-8 border-2 border-accent/30 animate-breathing">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center glow-accent"
                        >
                            <Wallet className="w-8 h-8 text-accent" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gradient">สมัครสมาชิก</h1>
                        <p className="text-muted text-sm mt-1">สร้างบัญชีใหม่เพื่อใช้งาน MMRRDiKub</p>
                    </div>

                    {/* Success Message */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-profit/20 flex items-center justify-center glow-profit">
                                <Check className="w-8 h-8 text-profit" />
                            </div>
                            <h2 className="text-xl font-bold text-profit mb-2">สมัครสำเร็จ! 🎉</h2>
                            <p className="text-muted mb-4">กำลังพาไปหน้า Login...</p>
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
                        </motion.div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ตั้งชื่อผู้ใช้ (3+ ตัวอักษร)"
                                    className="w-full px-4 py-3 rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full px-4 py-3 rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="ตั้งรหัสผ่าน (6+ ตัวอักษร)"
                                        className="w-full px-4 py-3 pr-12 rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent/20 transition-all"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5 text-muted" /> : <Eye className="w-5 h-5 text-muted" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    ยืนยัน Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                                        className={cn(
                                            "w-full px-4 py-3 pr-12 rounded-xl glass border outline-none transition-all",
                                            confirmPassword && password !== confirmPassword
                                                ? "border-loss focus:border-loss"
                                                : "border-glass-border focus:border-accent"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent/20 transition-all"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted" /> : <Eye className="w-5 h-5 text-muted" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="text-loss text-xs mt-1">Password ไม่ตรงกัน</p>
                                )}
                            </div>

                            {/* 🔥 Error Message - แสดงชัดเจน */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl text-sm",
                                        isNetworkError ? "bg-yellow-500/20 text-yellow-400" : "bg-loss/20 text-loss"
                                    )}
                                >
                                    {isNetworkError ? (
                                        <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-medium">{error}</p>
                                        {isNetworkError && (
                                            <p className="text-xs mt-1 opacity-80">
                                                ตรวจสอบว่า Backend รันอยู่: <code className="bg-black/30 px-1 rounded">go run cmd/api/main.go</code>
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                                className="w-full py-3 rounded-xl font-semibold bg-accent text-white flex items-center justify-center gap-2 hover:glow-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        กำลังสมัคร...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        สมัครสมาชิก
                                    </>
                                )}
                            </motion.button>
                        </form>
                    )}

                    {/* Links */}
                    {!success && (
                        <div className="text-center mt-6 space-y-3">
                            <div className="flex items-center gap-2 justify-center text-sm">
                                <span className="text-muted">มีบัญชีอยู่แล้ว?</span>
                                <Link href="/login" className="text-accent hover:underline flex items-center gap-1 font-medium">
                                    เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <Link href="/" className="text-sm text-muted hover:text-accent transition-all block">
                                ← กลับหน้าหลัก
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
