"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// Using the provided Next.js router from the original requirement
// We import useRouter from next/navigation
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1);
    const [contact, setContact] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState(0);
    const router = useRouter();

    // Handle countdown timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Use the API URL from environment variable, default to NEXT_PUBLIC_API_URL or localhost
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    // Ensure we don't have double /api/api/ if NEXT_PUBLIC_API_URL already trailing with /api
    const NEXT_PUBLIC_API_URL = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

    const requestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (countdown > 0) return; // Prevent double trigger

        setLoading(true); setError("");
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/forgot-password/request`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact })
        });
        setLoading(false);
        if (res.ok) {
            setCountdown(60); // Start 1 minute countdown
            setStep(2);
        }
        else { const d = await res.json(); setError(d.message); }
    };

    const resendOtp = async () => {
        if (countdown > 0) return;
        setLoading(true); setError("");
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/forgot-password/request`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact })
        });
        setLoading(false);
        if (res.ok) {
            setCountdown(60); // Reset timer
        } else {
            const d = await res.json(); setError(d.message);
        }
    };

    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/forgot-password/verify`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact, otp })
        });
        setLoading(false);
        if (res.ok) setStep(3);
        else { const d = await res.json(); setError(d.message); }
    };

    const resetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/auth/forgot-password/reset`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact, otp, newPassword })
        });
        setLoading(false);
        if (res.ok) setStep(4);
        else { const d = await res.json(); setError(d.message); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-mono">
            <div className="bg-[#111111] p-8 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.2)] border border-green-500/30 w-full max-w-md relative overflow-hidden">
                {/* Decorative top line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>

                <h2 className="text-2xl font-bold text-center mb-6 text-green-400 uppercase tracking-wider">
                    {step === 1 && "Reset Password"}
                    {step === 2 && "Verify Identity"}
                    {step === 3 && "New Credentials"}
                    {step === 4 && "System Restored!"}
                </h2>

                {error && <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center mb-4">{error}</div>}

                {step === 1 && (
                    <form onSubmit={requestOtp} className="space-y-4">
                        <input type="email" placeholder="ENTER_EMAIL_ADDRESS" value={contact} onChange={e => setContact(e.target.value)} className="w-full p-3 bg-[#0a0a0a] border border-green-500/50 rounded-xl text-green-100 placeholder-green-700/50 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all" required />
                        <button disabled={loading} className="w-full bg-green-600/10 border border-green-500 text-green-400 py-3 rounded-xl font-bold hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest">
                            {loading ? "Transmitting..." : "Send_OTP"}
                        </button>
                        <div className="text-center mt-4">
                            <Link href="/login" className="text-sm text-green-600/70 hover:text-green-400 transition-all underline">Back to Login</Link>
                        </div>

                        {/* ℹ️ Helper text explaining Render free tier limitations */}
                        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                            <h4 className="text-yellow-500 text-sm font-bold mb-2">⚠️ แจ้งเตือนเรื่องการส่งอีเมล</h4>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                ระบบสามารถส่งอีเมล OTP ได้จริงเมื่อรันแบบ Localhost แต่เนื่องจาก Production ปัจจุบันโฮสต์บนบริการฟรีของ Render ซึ่ง <strong className="text-yellow-400">บล็อกพอร์ตส่งอีเมล (Port 587)</strong> ทำให้ไม่สามารถส่งอีเมลออกไปได้
                                <br /><br />
                                เพื่อการทดสอบระบบ Password Reset <strong>ระบบจำลองจะแจ้งรหัส OTP ผ่านทาง Server Console แทน</strong> หากต้องการทดสอบแบบส่งอีเมลจริง หรือสนใจรับผู้พัฒนาเข้าทำงาน โปรดติดต่อ <a href="mailto:akkaraphon7tech@gmail.com" className="text-blue-400 underline">akkaraphon7tech@gmail.com</a>
                            </p>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={verifyOtp} className="space-y-4">
                        <p className="text-sm text-center text-green-600/70">Awaiting 6-digit confirmation code...</p>
                        <input type="text" placeholder="XXXXXX" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-3 bg-[#0a0a0a] border border-green-500/50 rounded-xl text-center text-3xl tracking-[0.5em] text-green-400 placeholder-green-800 focus:outline-none focus:border-green-400 transition-all" required />
                        <button disabled={loading} className="w-full bg-green-600/10 border border-green-500 text-green-400 py-3 rounded-xl font-bold hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 uppercase tracking-widest">
                            {loading ? "Verifying..." : "Confirm_OTP"}
                        </button>
                        <div className="text-center mt-4 space-y-2">
                            <button
                                type="button"
                                onClick={resendOtp}
                                disabled={countdown > 0 || loading}
                                className="block w-full text-sm text-green-600/70 hover:text-green-400 transition-all underline disabled:no-underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="block w-full text-sm text-green-600/70 hover:text-green-400 transition-all underline">Go back</button>
                        </div>

                        {/* 📷 Proof image showing that Email OTP actually works on local */}
                        <div className="mt-6 border border-gray-700 rounded-xl overflow-hidden shadow-lg shadow-black/50">
                            <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 border-b border-gray-700 flex justify-between items-center">
                                <span>หลักฐานการส่ง Email OTP (Localhost)</span>
                            </div>
                            <img
                                src="/mmrrdikubotp.jpg"
                                alt="Email OTP Notification Proof"
                                className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={resetPassword} className="space-y-4">
                        <input type="password" placeholder="NEW_PASSWORD" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-[#0a0a0a] border border-green-500/50 rounded-xl text-green-100 placeholder-green-700/50 focus:outline-none focus:border-green-400 transition-all" required />
                        <button disabled={loading} className="w-full bg-green-600/10 border border-green-500 text-green-400 py-3 rounded-xl font-bold hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 uppercase tracking-widest">
                            {loading ? "Encrypting..." : "Update_Security_Key"}
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <div className="text-center">
                        <div className="text-green-400 text-6xl mb-4 animate-pulse">■</div>
                        <p className="mb-6 text-green-500">Access codes updated successfully.</p>
                        <Link href="/login" className="block w-full bg-green-500 text-black py-3 rounded-xl font-bold hover:bg-green-400 transition-all uppercase tracking-widest">
                            Login_To_Terminal
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
