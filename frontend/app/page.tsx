'use client';
/**
 * page.tsx - หน้าหลักของ MMRRDiKub (Multi-Language + Mobile Optimized)
 * ✅ รองรับ 10 ภาษา | ✅ Data Persistence | ✅ Mobile-First
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Calculator from './components/Calculator';
import Link from 'next/link';
import { Lock, BarChart3, TrendingUp, User, Star } from 'lucide-react';

function HomeContent() {
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <main className="pt-16 sm:pt-20 pb-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4"
          >
            Trade <span className="text-gradient">Smarter</span>, Not Harder
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted text-sm sm:text-lg max-w-2xl mx-auto"
          >
            {t('heroSubtitle')}
          </motion.p>

          {/* Welcome Message when Logged In */}
          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/20 text-accent text-sm"
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t('welcome')} <strong>{username}</strong>! 🚀</span>
            </motion.div>
          )}
        </motion.section>

        {/* Calculator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 sm:mb-12"
        >
          <Calculator />
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-[var(--border)] hover:border-green-600/50 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-600/20 flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900 dark:text-white">{t('riskMgmt')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{t('riskMgmtDesc')}</p>
          </div>

          <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-[var(--border)] hover:border-accent/50 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-3 sm:mb-4">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900 dark:text-white">{t('tradeJournal')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{t('tradeJournalDesc')}</p>
          </div>

          <div className="bg-white dark:bg-[var(--surface)] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-[var(--border)] hover:border-yellow-500/50 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-3 sm:mb-4">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2 text-gray-900 dark:text-white">{t('aiScore')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{t('aiScoreDesc')}</p>
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
              className="bg-gradient-to-br from-gray-50 to-white dark:from-[var(--surface)] dark:to-black rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center border border-accent/30"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-2xl bg-accent/20 flex items-center justify-center"
              >
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              </motion.div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                {t('unlockFeatures')}
              </h2>

              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6 sm:mb-8">
                {t('ctaDesc')}
              </p>

              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { text: '💾 Save', icon: '' },
                  { text: '📊 History', icon: '' },
                  { text: '📈 Stats', icon: '' },
                  { text: '🤖 AI', icon: '' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="px-3 py-1.5 rounded-full bg-gray-200/50 dark:bg-[#30363d]/50 text-gray-700 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    {feature.text}
                  </motion.div>
                ))}
              </div>

              <Link href="/login">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-accent to-green-500 text-white font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl inline-block cursor-pointer hover:shadow-lg hover:shadow-accent/30 transition-all"
                >
                  🚀 {t('start')}
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
              className="bg-white dark:bg-[var(--surface)] rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-[var(--border)] text-center"
            >
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">⚡ {t('quickActions')}</h3>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <Link
                  href="/dashboard"
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-accent/20 text-accent font-medium hover:bg-accent/30 transition-all flex items-center gap-2 text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  {t('viewHistory')}
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500 border-t border-[#30363d]">
        <p>Made with 💚 by akkaraphon7tech@gmail.com</p>
        <p className="mt-1">{t('footer')} | © 2026</p>
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
