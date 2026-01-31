'use client';
/*
  page.tsx - หน้าหลักของ MMRRDiKub
  แสดง Calculator + Banner ชวน Login (เฉพาะตอนไม่ได้ Login)
*/

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Calculator from './components/Calculator';
import Link from 'next/link';
import { Lock, Sparkles, BarChart3, TrendingUp, Zap, User, Star } from 'lucide-react';

function HomeContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  // Check login status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('username');
      setIsLoggedIn(!!token);
      setUsername(user || '');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Trade <span className="text-gradient">Smarter</span>, Not Harder
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted text-lg max-w-2xl mx-auto"
          >
            เครื่องมือคำนวณ Position Size ระดับมืออาชีพ พร้อมระบบบันทึกและวิเคราะห์การเทรด
          </motion.p>

          {/* Welcome Message when Logged In */}
          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent"
            >
              <User className="w-4 h-4" />
              <span>สวัสดี <strong>{username}</strong>! พร้อมเทรดแล้ว 🚀</span>
            </motion.div>
          )}
        </motion.section>

        {/* Calculator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Calculator />
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] hover:border-green-600/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Risk Management</h3>
            <p className="text-gray-400 text-sm">คำนวณขนาดไม้ที่เหมาะสมกับความเสี่ยงที่รับได้</p>
          </div>

          <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] hover:border-accent/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-bold mb-2">Trade Journal</h3>
            <p className="text-gray-400 text-sm">บันทึกและติดตามประวัติการเทรดทั้งหมด</p>
          </div>

          <div className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] hover:border-yellow-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Trade Score</h3>
            <p className="text-gray-400 text-sm">คะแนนประเมิน Setup และคำแนะนำป้องกันความเสี่ยง</p>
          </div>
        </motion.section>

        {/* CTA Section - ONLY SHOW WHEN NOT LOGGED IN */}
        <AnimatePresence>
          {!isLoggedIn && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-[#161b22] to-[#0d1117] rounded-3xl p-8 sm:p-12 text-center border border-accent/30"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/20 flex items-center justify-center"
              >
                <Lock className="w-8 h-8 text-accent" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                ปลดล็อค <span className="text-gradient">Full Features</span>
              </h2>

              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Login เพื่อบันทึกแผนการเทรด ดูประวัติ และรับคำแนะนำจาก AI
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {[
                  { text: 'บันทึกแผนเทรด', icon: '💾' },
                  { text: 'ดูประวัติทั้งหมด', icon: '📊' },
                  { text: 'สถิติ WinRate', icon: '📈' },
                  { text: 'AI แจ้งเตือน', icon: '🤖' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#30363d]/50 text-sm"
                  >
                    <span>{feature.icon}</span>
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              <Link href="/login">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-accent to-green-500 text-white font-bold text-lg px-8 py-4 rounded-xl inline-block cursor-pointer hover:shadow-lg hover:shadow-accent/30 transition-all"
                >
                  🚀 เริ่มต้นใช้งาน
                </motion.span>
              </Link>
            </motion.section>
          )}
        </AnimatePresence>

        {/* When Logged In - Show Quick Links */}
        <AnimatePresence>
          {isLoggedIn && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] text-center"
            >
              <h3 className="text-lg font-bold mb-4">⚡ Quick Actions</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-accent/20 text-accent font-medium hover:bg-accent/30 transition-all flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  ดูประวัติการเทรด
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-[#30363d]">
        <p>Made with 💚 by MMRRDiKub Team</p>
        <p className="mt-1">© 2026 All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  );
}
