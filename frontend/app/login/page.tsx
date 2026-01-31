'use client';
/*
  Login Page - หน้าเข้าสู่ระบบ (Updated)
  - เพิ่มปุ่มแสดง/ซ่อน Password (Eye icon)
  - เพิ่ม Link ไปหน้าสมัครสมาชิก
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

    // State สำหรับ Form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State สำหรับ Toggle Password Visibility
    const [showPassword, setShowPassword] = useState(false);

    // === Handle Submit ===
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate
        if (!username || !password) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }

        setLoading(true);

        try {
            // เรียก API Login
            const response = await authAPI.login({ username, password });
            const { token, user } = response.data;

            // เก็บ Token ใน localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('username', user.username);

            // Redirect ไปหน้าหลัก
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Username หรือ Password ไม่ถูกต้อง');
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

            {/* Login Card */}
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
                        <h1 className="text-2xl font-bold text-gradient">เข้าสู่ระบบ</h1>
                        <p className="text-muted text-sm mt-1">ยินดีต้อนรับกลับมา!</p>
                    </div>

                    {/* Form */}
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
                                placeholder="กรอก Username"
                                className="w-full px-4 py-3 rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                            />
                        </div>

                        {/* Password พร้อมปุ่ม Toggle Visibility */}
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
                                    placeholder="กรอก Password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl glass border border-glass-border focus:border-accent outline-none transition-all"
                                />
                                {/* Toggle Password Visibility Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent/20 transition-all"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 text-muted" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-muted" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-3 rounded-xl bg-loss/20 text-loss text-sm"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold bg-accent text-white flex items-center justify-center gap-2 hover:glow-accent transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    เข้าสู่ระบบ
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Links */}
                    <div className="text-center mt-6 space-y-3">
                        {/* Link ไปหน้าสมัครสมาชิก */}
                        <div className="flex items-center gap-2 justify-center text-sm">
                            <span className="text-muted">ยังไม่มีบัญชี?</span>
                            <Link href="/register" className="text-accent hover:underline flex items-center gap-1 font-medium">
                                สมัครสมาชิก <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Link กลับหน้าหลัก */}
                        <Link href="/" className="text-sm text-muted hover:text-accent transition-all block">
                            ← กลับหน้าหลัก
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
