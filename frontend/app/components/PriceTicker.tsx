'use client';
/**
 * PriceTicker.tsx - World-Class Financial Platform Ticker (Bloomberg Terminal Style)
 * 📈 Fetches 5 pairs: BTC, ETH, SOL, BNB, GOLD from Binance Public API
 * ✅ Real logos from CoinMarketCap via next/image
 * ✅ Monospaced font for prices (no jumping)
 * ✅ Glass effect background with subtle separators
 * ✅ Client-side only to prevent hydration errors
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
  symbol: string;
  displayName: string;
  logoUrl: string;
  price: number;
  changePercent: number;
  loading: boolean;
  error: boolean;
}

const TICKER_CONFIG = [
  { 
    symbol: 'BTCUSDT', 
    displayName: 'BTC', 
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' 
  },
  { 
    symbol: 'ETHUSDT', 
    displayName: 'ETH', 
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' 
  },
  { 
    symbol: 'SOLUSDT', 
    displayName: 'SOL', 
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' 
  },
  { 
    symbol: 'BNBUSDT', 
    displayName: 'BNB', 
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' 
  },
  { 
    symbol: 'PAXGUSDT', 
    displayName: 'GOLD', 
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4705.png' 
  },
];

export default function PriceTicker() {
  const [tickers, setTickers] = useState<TickerData[]>(
    TICKER_CONFIG.map((t) => ({
      ...t,
      price: 0,
      changePercent: 0,
      loading: true,
      error: false,
    }))
  );
  const [mounted, setMounted] = useState(false);

  // ป้องกัน Hydration Error: รอให้ mount บน client ก่อน
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch ราคาจาก Binance Public API
  useEffect(() => {
    if (!mounted) return;

    const fetchPrices = async () => {
      const newTickers = await Promise.all(
        TICKER_CONFIG.map(async (config) => {
          try {
            const response = await fetch(
              `https://api.binance.com/api/v3/ticker/24hr?symbol=${config.symbol}`
            );
            
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            return {
              ...config,
              price: parseFloat(data.lastPrice),
              changePercent: parseFloat(data.priceChangePercent),
              loading: false,
              error: false,
            };
          } catch (err) {
            console.warn(`Failed to fetch ${config.symbol}:`, err);
            return {
              ...config,
              price: 0,
              changePercent: 0,
              loading: false,
              error: true,
            };
          }
        })
      );
      setTickers(newTickers);
    };

    // Fetch ทันทีและทุก 30 วินาที
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, [mounted]);

  // ป้องกัน Hydration: แสดง skeleton 5 ตัว
  if (!mounted) {
    return (
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-center gap-0 min-w-max px-4 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-3 min-w-[140px]"
            >
              <div className="w-6 h-6 rounded-full bg-gray-700 animate-pulse" />
              <div className="flex flex-col gap-1">
                <div className="h-3 w-12 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, symbol: string) => {
    if (price === 0) return '---';
    // GOLD แสดง 2 ตำแหน่ง, อื่นๆ แสดงตาม range
    if (symbol === 'GOLD') return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-x-auto scrollbar-hide"
    >
      {/* Bloomberg-style horizontal bar with glass effect */}
      <div className="flex items-center justify-center gap-0 min-w-max bg-[#161b22]/80 backdrop-blur-md border-y border-[#30363d]/50 px-4 py-3">
        {tickers.map((ticker, index) => (
          <motion.div
            key={ticker.symbol}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center gap-2.5 px-4 py-2 min-w-[140px] border-r border-[#30363d]/30 last:border-r-0 hover:bg-white/5 transition-colors duration-200"
          >
            {/* Circular Logo */}
            <div className="relative w-6 h-6 flex-shrink-0">
              <Image
                src={ticker.logoUrl}
                alt={ticker.displayName}
                width={24}
                height={24}
                className="rounded-full"
                unoptimized
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-0.5">
              {/* Symbol Name (Bold) */}
              <span className="text-xs font-bold text-gray-300 tracking-wide">
                {ticker.displayName}
              </span>

              {/* Price & Change */}
              {ticker.loading ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500 font-mono">Loading...</span>
                </div>
              ) : ticker.error ? (
                <span className="text-xs text-rose-400 font-mono">Error</span>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Price (Monospaced font to prevent jumping) */}
                  <span className="text-sm font-mono font-semibold text-white">
                    ${formatPrice(ticker.price, ticker.displayName)}
                  </span>

                  {/* Change Percent with icon */}
                  <span
                    className={`flex items-center text-xs font-mono font-medium ${
                      ticker.changePercent >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-500'
                    }`}
                  >
                    {ticker.changePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {ticker.changePercent >= 0 ? '+' : ''}
                    {ticker.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
