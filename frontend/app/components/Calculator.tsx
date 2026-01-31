'use client';
/**
 * Calculator.tsx - PRODUCTION Position Size Calculator
 * 🔥 FINAL: Dynamic formatting, realistic AI Score, mobile optimized
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tradeAPI } from '../utils/api';
import { formatPrice, formatUSD, formatPercent } from '../utils/format';
import { calculateTradeMetrics, formatRR } from '../utils/tradeCalculations';
import { cn } from '../lib/cn';
import {
    Calculator as CalcIcon,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Target,
    Shield,
    Zap,
    Star,
    Save,
    Search,
    ChevronDown,
    AlertTriangle,
    Loader2,
    Check,
    Percent,
    Award,
    Plus,
    X,
    ArrowRight,
    AlertCircle,
    Info,
    Brain,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// 120+ Trading Pairs with Categories (Enhanced Search)
// ============================================
interface TradingPair {
    symbol: string;
    category: string;
    keywords?: string; // Additional search keywords
}

const TRADING_PAIRS_DATA: TradingPair[] = [
    // Top 30 by Volume
    { symbol: 'BTC/USDT', category: 'Layer 1', keywords: 'bitcoin บิทคอยน์' },
    { symbol: 'ETH/USDT', category: 'Layer 1', keywords: 'ethereum อีเทอเรียม' },
    { symbol: 'BNB/USDT', category: 'Layer 1', keywords: 'binance' },
    { symbol: 'XRP/USDT', category: 'Layer 1', keywords: 'ripple' },
    { symbol: 'SOL/USDT', category: 'Layer 1', keywords: 'solana' },
    { symbol: 'ADA/USDT', category: 'Layer 1', keywords: 'cardano' },
    { symbol: 'DOGE/USDT', category: 'Meme', keywords: 'dogecoin หมา' },
    { symbol: 'AVAX/USDT', category: 'Layer 1', keywords: 'avalanche' },
    { symbol: 'DOT/USDT', category: 'Layer 1', keywords: 'polkadot' },
    { symbol: 'TRX/USDT', category: 'Layer 1', keywords: 'tron' },
    { symbol: 'LINK/USDT', category: 'Oracle', keywords: 'chainlink' },
    { symbol: 'MATIC/USDT', category: 'Layer 2', keywords: 'polygon' },
    { symbol: 'SHIB/USDT', category: 'Meme', keywords: 'shiba' },
    { symbol: 'LTC/USDT', category: 'Layer 1', keywords: 'litecoin' },
    { symbol: 'ATOM/USDT', category: 'Layer 1', keywords: 'cosmos' },
    { symbol: 'UNI/USDT', category: 'DeFi', keywords: 'uniswap' },
    { symbol: 'XLM/USDT', category: 'Layer 1', keywords: 'stellar' },
    { symbol: 'ETC/USDT', category: 'Layer 1', keywords: 'ethereum classic' },
    { symbol: 'XMR/USDT', category: 'Privacy', keywords: 'monero' },
    { symbol: 'HBAR/USDT', category: 'Layer 1', keywords: 'hedera' },
    { symbol: 'BCH/USDT', category: 'Layer 1', keywords: 'bitcoin cash' },
    { symbol: 'FIL/USDT', category: 'Storage', keywords: 'filecoin' },
    { symbol: 'APT/USDT', category: 'Layer 1', keywords: 'aptos' },
    { symbol: 'ARB/USDT', category: 'Layer 2', keywords: 'arbitrum' },
    { symbol: 'OP/USDT', category: 'Layer 2', keywords: 'optimism' },
    { symbol: 'NEAR/USDT', category: 'Layer 1', keywords: 'near protocol' },
    { symbol: 'VET/USDT', category: 'Supply Chain', keywords: 'vechain' },
    { symbol: 'ALGO/USDT', category: 'Layer 1', keywords: 'algorand' },
    { symbol: 'ICP/USDT', category: 'Layer 1', keywords: 'internet computer' },
    { symbol: 'GRT/USDT', category: 'Indexing', keywords: 'the graph' },
    // Layer 2
    { symbol: 'IMX/USDT', category: 'Layer 2', keywords: 'immutable x' },
    { symbol: 'MANTA/USDT', category: 'Layer 2', keywords: 'manta network' },
    { symbol: 'STRK/USDT', category: 'Layer 2', keywords: 'starknet' },
    { symbol: 'ZK/USDT', category: 'Layer 2', keywords: 'zksync' },
    { symbol: 'SKL/USDT', category: 'Layer 2', keywords: 'skale' },
    // DeFi
    { symbol: 'AAVE/USDT', category: 'DeFi', keywords: 'lending' },
    { symbol: 'MKR/USDT', category: 'DeFi', keywords: 'maker dao' },
    { symbol: 'SNX/USDT', category: 'DeFi', keywords: 'synthetix' },
    { symbol: 'COMP/USDT', category: 'DeFi', keywords: 'compound' },
    { symbol: 'YFI/USDT', category: 'DeFi', keywords: 'yearn finance' },
    { symbol: 'CRV/USDT', category: 'DeFi', keywords: 'curve' },
    { symbol: 'SUSHI/USDT', category: 'DeFi', keywords: 'sushiswap' },
    { symbol: '1INCH/USDT', category: 'DeFi', keywords: 'aggregator' },
    { symbol: 'LDO/USDT', category: 'DeFi', keywords: 'lido staking' },
    { symbol: 'RUNE/USDT', category: 'DeFi', keywords: 'thorchain' },
    { symbol: 'CAKE/USDT', category: 'DeFi', keywords: 'pancakeswap' },
    { symbol: 'DYDX/USDT', category: 'DeFi', keywords: 'derivatives' },
    { symbol: 'GMX/USDT', category: 'DeFi', keywords: 'perpetual' },
    { symbol: 'PENDLE/USDT', category: 'DeFi', keywords: 'yield' },
    { symbol: 'JUP/USDT', category: 'DeFi', keywords: 'jupiter' },
    // Gaming & Metaverse
    { symbol: 'AXS/USDT', category: 'Gaming', keywords: 'axie infinity' },
    { symbol: 'SAND/USDT', category: 'Metaverse', keywords: 'sandbox' },
    { symbol: 'MANA/USDT', category: 'Metaverse', keywords: 'decentraland' },
    { symbol: 'ENJ/USDT', category: 'Gaming', keywords: 'enjin' },
    { symbol: 'GALA/USDT', category: 'Gaming', keywords: 'gala games' },
    { symbol: 'APE/USDT', category: 'Metaverse', keywords: 'bored ape' },
    { symbol: 'GMT/USDT', category: 'Gaming', keywords: 'stepn' },
    { symbol: 'FLOW/USDT', category: 'Gaming', keywords: 'nft' },
    { symbol: 'CHZ/USDT', category: 'Fan Token', keywords: 'chiliz' },
    { symbol: 'RNDR/USDT', category: 'Rendering', keywords: 'render' },
    { symbol: 'MAGIC/USDT', category: 'Gaming', keywords: 'treasure' },
    { symbol: 'PIXEL/USDT', category: 'Gaming', keywords: 'pixels' },
    { symbol: 'PRIME/USDT', category: 'Gaming', keywords: 'parallel' },
    { symbol: 'BEAM/USDT', category: 'Gaming', keywords: 'merit circle' },
    // AI Tokens
    { symbol: 'FET/USDT', category: 'AI', keywords: 'fetch ai' },
    { symbol: 'AGIX/USDT', category: 'AI', keywords: 'singularitynet' },
    { symbol: 'OCEAN/USDT', category: 'AI', keywords: 'ocean protocol' },
    { symbol: 'TAO/USDT', category: 'AI', keywords: 'bittensor' },
    { symbol: 'ARKM/USDT', category: 'AI', keywords: 'arkham' },
    { symbol: 'WLD/USDT', category: 'AI', keywords: 'worldcoin' },
    { symbol: 'AIOZ/USDT', category: 'AI', keywords: 'ai streaming' },
    { symbol: 'NMR/USDT', category: 'AI', keywords: 'numerai' },
    // Meme Coins
    { symbol: 'PEPE/USDT', category: 'Meme', keywords: 'frog กบ' },
    { symbol: 'FLOKI/USDT', category: 'Meme', keywords: 'floki inu' },
    { symbol: 'BONK/USDT', category: 'Meme', keywords: 'solana meme' },
    { symbol: 'WIF/USDT', category: 'Meme', keywords: 'dogwifhat หมวก' },
    { symbol: 'MEME/USDT', category: 'Meme', keywords: 'meme coin' },
    { symbol: 'SATS/USDT', category: 'BRC-20', keywords: 'ordinals' },
    { symbol: 'RATS/USDT', category: 'BRC-20', keywords: 'ordinals' },
    { symbol: 'ORDI/USDT', category: 'BRC-20', keywords: 'ordinals' },
    // Thai Market
    { symbol: 'KUB/USDT', category: 'Thai', keywords: 'bitkub ไทย' },
    { symbol: 'SIX/USDT', category: 'Thai', keywords: 'six network ไทย' },
    { symbol: 'JFIN/USDT', category: 'Thai', keywords: 'jaymart ไทย' },
    // New Layer 1s
    { symbol: 'INJ/USDT', category: 'Layer 1', keywords: 'injective' },
    { symbol: 'SUI/USDT', category: 'Layer 1', keywords: 'sui network' },
    { symbol: 'SEI/USDT', category: 'Layer 1', keywords: 'sei network' },
    { symbol: 'TIA/USDT', category: 'Modular', keywords: 'celestia' },
    { symbol: 'PYTH/USDT', category: 'Oracle', keywords: 'pyth network' },
    { symbol: 'W/USDT', category: 'Bridge', keywords: 'wormhole' },
    { symbol: 'DYM/USDT', category: 'Modular', keywords: 'dymension' },
    { symbol: 'KAS/USDT', category: 'Layer 1', keywords: 'kaspa pow' },
    { symbol: 'CFX/USDT', category: 'Layer 1', keywords: 'conflux' },
    { symbol: 'ROSE/USDT', category: 'Privacy', keywords: 'oasis' },
    { symbol: 'FTM/USDT', category: 'Layer 1', keywords: 'fantom' },
    // Storage & Infrastructure
    { symbol: 'AR/USDT', category: 'Storage', keywords: 'arweave' },
    { symbol: 'STORJ/USDT', category: 'Storage', keywords: 'storj' },
    { symbol: 'THETA/USDT', category: 'Video', keywords: 'theta network' },
    { symbol: 'BTT/USDT', category: 'Storage', keywords: 'bittorrent' },
    { symbol: 'SC/USDT', category: 'Storage', keywords: 'siacoin' },
    { symbol: 'HOT/USDT', category: 'Infrastructure', keywords: 'holo' },
    { symbol: 'ANKR/USDT', category: 'Infrastructure', keywords: 'rpc' },
    // Privacy
    { symbol: 'ZEC/USDT', category: 'Privacy', keywords: 'zcash' },
    { symbol: 'DASH/USDT', category: 'Privacy', keywords: 'dash' },
    { symbol: 'ZEN/USDT', category: 'Privacy', keywords: 'horizen' },
    { symbol: 'SCRT/USDT', category: 'Privacy', keywords: 'secret' },
    // Others
    { symbol: 'KLAY/USDT', category: 'Layer 1', keywords: 'klaytn' },
    { symbol: 'EGLD/USDT', category: 'Layer 1', keywords: 'multiversx elrond' },
    { symbol: 'QNT/USDT', category: 'Interoperability', keywords: 'quant' },
    { symbol: 'STX/USDT', category: 'Bitcoin L2', keywords: 'stacks' },
    { symbol: 'MINA/USDT', category: 'Layer 1', keywords: 'mina protocol' },
    { symbol: 'ENS/USDT', category: 'Identity', keywords: 'ethereum name' },
    { symbol: 'SSV/USDT', category: 'Staking', keywords: 'ssv network' },
    { symbol: 'RPL/USDT', category: 'Staking', keywords: 'rocket pool' },
    { symbol: 'BLUR/USDT', category: 'NFT', keywords: 'nft marketplace' },
    { symbol: 'LOOKS/USDT', category: 'NFT', keywords: 'looksrare' },
];

// Legacy array for backward compatibility
const TRADING_PAIRS = TRADING_PAIRS_DATA.map(p => p.symbol);


const EXCHANGES = [
    { name: 'Binance Futures', makerFee: 0.02, takerFee: 0.05 },
    { name: 'Binance Spot', makerFee: 0.1, takerFee: 0.1 },
    { name: 'Bitkub', makerFee: 0.25, takerFee: 0.25 },
    { name: 'OKX Futures', makerFee: 0.02, takerFee: 0.05 },
    { name: 'Bybit Futures', makerFee: 0.02, takerFee: 0.055 },
    { name: 'Gate.io Futures', makerFee: 0.02, takerFee: 0.05 },
    { name: 'MEXC Futures', makerFee: 0, takerFee: 0.03 },
    { name: 'Custom', makerFee: 0, takerFee: 0 },
];

const ENTRY_REASONS = [
    'RSI Divergence', 'MACD Crossover', 'Support Bounce', 'Resistance Break',
    'Trendline Touch', 'Fibonacci 0.618', 'Fibonacci 0.786', 'MA Cross',
    'Volume Spike', 'Order Block', 'Fair Value Gap', 'Liquidity Sweep',
    'News/Fundamental', 'Pattern (H&S)', 'Pattern (Triangle)', 'Pattern (Wedge)',
    'Breakout Retest', 'Double Bottom/Top', 'Custom...',
];

interface TPLevel { id: string; price: number; percent: number; }
interface SLLevel { id: string; price: number; percent: number; }

interface CalculatorInputs {
    pair: string;
    side: 'LONG' | 'SHORT';
    portfolio: number;
    entryPrice: number;
    riskPercent: number;
    leverage: number;
    exchange: string;
    customFee: number;
    entryReason: string;
    customReason: string;
    tpLevels: TPLevel[];
    slLevels: SLLevel[];
}

export default function Calculator() {
    const [inputs, setInputs] = useState<CalculatorInputs>({
        pair: 'BTC/USDT',
        side: 'LONG',
        portfolio: 1000,
        entryPrice: 0,
        riskPercent: 1,
        leverage: 1,
        exchange: 'Binance Futures',
        customFee: 0.05,
        entryReason: '',
        customReason: '',
        tpLevels: [{ id: '1', price: 0, percent: 100 }],
        slLevels: [{ id: '1', price: 0, percent: 100 }],
    });

    const [showPairDropdown, setShowPairDropdown] = useState(false);
    const [pairSearch, setPairSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState('');

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.pair-dropdown-container')) {
                setShowPairDropdown(false);
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const feeRate = useMemo(() => {
        const ex = EXCHANGES.find(e => e.name === inputs.exchange);
        return ex?.name !== 'Custom' ? (ex?.takerFee || 0.05) : inputs.customFee;
    }, [inputs.exchange, inputs.customFee]);

    // Enhanced search: matches symbol, category, or keywords
    const filteredPairs = useMemo(() => {
        const searchTerm = pairSearch.toLowerCase().trim();
        if (!searchTerm) return TRADING_PAIRS_DATA.slice(0, 25);

        return TRADING_PAIRS_DATA.filter(pair => {
            const symbolMatch = pair.symbol.toLowerCase().includes(searchTerm);
            const categoryMatch = pair.category.toLowerCase().includes(searchTerm);
            const keywordsMatch = pair.keywords?.toLowerCase().includes(searchTerm);
            return symbolMatch || categoryMatch || keywordsMatch;
        }).slice(0, 25);
    }, [pairSearch]);

    const tpTotal = useMemo(() => inputs.tpLevels.reduce((sum, tp) => sum + (tp.percent || 0), 0), [inputs.tpLevels]);
    const slTotal = useMemo(() => inputs.slLevels.reduce((sum, sl) => sum + (sl.percent || 0), 0), [inputs.slLevels]);

    const getDistancePercent = (price: number, isTP: boolean) => {
        if (!inputs.entryPrice || inputs.entryPrice <= 0 || !price) return 0;
        if (inputs.side === 'LONG') {
            return isTP
                ? ((price - inputs.entryPrice) / inputs.entryPrice) * 100
                : ((inputs.entryPrice - price) / inputs.entryPrice) * 100;
        } else {
            return isTP
                ? ((inputs.entryPrice - price) / inputs.entryPrice) * 100
                : ((price - inputs.entryPrice) / inputs.entryPrice) * 100;
        }
    };

    // ============================================
    // 🔥 QUANT-STANDARD CALCULATION
    // Using strict financial formulas
    // ============================================
    const calculation = useMemo(() => {
        const { portfolio, entryPrice, riskPercent, leverage, side, tpLevels, slLevels } = inputs;

        // Get metrics from Quant calculation module
        const metrics = calculateTradeMetrics({
            portfolio,
            entryPrice,
            riskPercent,
            leverage,
            side,
            tpLevels,
            slLevels,
            feePercent: feeRate,
        });

        // AI Scoring (keep existing logic)
        const warnings: string[] = [];
        const recommendations: string[] = [];
        const scoreBreakdown: { label: string; points: number; maxPoints: number; status: 'good' | 'warn' | 'bad' }[] = [];
        let totalPoints = 0;

        // 1. R:R Ratio (30 points)
        if (metrics.riskRewardRatio >= 3) {
            totalPoints += 30;
            scoreBreakdown.push({ label: 'R:R ≥ 3:1 ดีมาก', points: 30, maxPoints: 30, status: 'good' });
        } else if (metrics.riskRewardRatio >= 2) {
            totalPoints += 25;
            scoreBreakdown.push({ label: 'R:R ≥ 2:1 ดี', points: 25, maxPoints: 30, status: 'good' });
        } else if (metrics.riskRewardRatio >= 1.5) {
            totalPoints += 15;
            scoreBreakdown.push({ label: 'R:R 1.5:1 พอใช้', points: 15, maxPoints: 30, status: 'warn' });
        } else if (metrics.riskRewardRatio >= 1) {
            totalPoints += 5;
            scoreBreakdown.push({ label: 'R:R = 1:1 ต่ำ', points: 5, maxPoints: 30, status: 'warn' });
            warnings.push('⚠️ R:R 1:1 ต้อง Win Rate > 50%');
        } else {
            scoreBreakdown.push({ label: 'R:R < 1:1 แย่', points: 0, maxPoints: 30, status: 'bad' });
            warnings.push('🚨 R:R ต่ำกว่า 1 = เสี่ยงมากกว่าได้!');
        }

        // 2. Risk % (25 points)
        if (riskPercent <= 1) {
            totalPoints += 25;
            scoreBreakdown.push({ label: 'Risk ≤ 1% (Conservative)', points: 25, maxPoints: 25, status: 'good' });
        } else if (riskPercent <= 2) {
            totalPoints += 20;
            scoreBreakdown.push({ label: 'Risk ≤ 2% (Standard)', points: 20, maxPoints: 25, status: 'good' });
        } else if (riskPercent <= 5) {
            totalPoints += 10;
            scoreBreakdown.push({ label: 'Risk 2-5% (Moderate)', points: 10, maxPoints: 25, status: 'warn' });
            warnings.push('⚠️ Risk > 2%: อาจเสีย 15%+ ของพอร์ตถ้าแพ้ 3 ครั้ง');
        } else {
            scoreBreakdown.push({ label: 'Risk > 5% (Dangerous)', points: 0, maxPoints: 25, status: 'bad' });
            warnings.push('🔥 Risk > 5% = เล่นพนัน ไม่ใช่เทรด!');
        }

        // 3. Leverage (20 points)
        if (leverage <= 3) {
            totalPoints += 20;
            scoreBreakdown.push({ label: 'Leverage ≤ 3x (Safe)', points: 20, maxPoints: 20, status: 'good' });
        } else if (leverage <= 10) {
            totalPoints += 15;
            scoreBreakdown.push({ label: 'Leverage ≤ 10x (Moderate)', points: 15, maxPoints: 20, status: 'good' });
        } else if (leverage <= 25) {
            totalPoints += 5;
            scoreBreakdown.push({ label: 'Leverage 10-25x (High)', points: 5, maxPoints: 20, status: 'warn' });
            warnings.push('⚠️ Leverage > 25x = ถูก Liquidate แน่นอน');
        } else {
            scoreBreakdown.push({ label: 'Leverage > 25x (Degen)', points: 0, maxPoints: 20, status: 'bad' });
            warnings.push('💀 Leverage > 25x: Liquidation risk สูงมาก');
        }

        // 4. Entry Reason (15 points)
        if (inputs.entryReason && inputs.entryReason !== 'Custom...') {
            totalPoints += 15;
            scoreBreakdown.push({ label: 'มีเหตุผลการเข้าเทรด', points: 15, maxPoints: 15, status: 'good' });
        } else if (inputs.entryReason === 'Custom...' && inputs.customReason) {
            totalPoints += 12;
            scoreBreakdown.push({ label: 'มีเหตุผล (Custom)', points: 12, maxPoints: 15, status: 'good' });
        } else {
            scoreBreakdown.push({ label: 'ไม่มีเหตุผลการเข้า', points: 0, maxPoints: 15, status: 'bad' });
            warnings.push('❓ เทรดโดยไม่มีเหตุผล = เล่นอารมณ์');
        }

        // 5. TP/SL Validation (10 points)
        if (tpTotal === 100 && slTotal === 100 && metrics.weightedSLDistance > 0 && metrics.weightedTPDistance > 0) {
            totalPoints += 10;
            scoreBreakdown.push({ label: 'TP/SL ครบถ้วน 100%', points: 10, maxPoints: 10, status: 'good' });
        } else {
            scoreBreakdown.push({ label: 'TP/SL ไม่ครบ 100%', points: 0, maxPoints: 10, status: 'bad' });
            if (tpTotal !== 100) warnings.push(`📊 TP รวม ${tpTotal}% (ต้องครบ 100%)`);
            if (slTotal !== 100) warnings.push(`📊 SL รวม ${slTotal}% (ต้องครบ 100%)`);
        }

        // Margin validation warning
        if (metrics.marginExceedsPortfolio) {
            warnings.push(metrics.errorMessage);
        }

        // Final score
        const setupScore = Math.round((totalPoints / 100) * 5);
        if (warnings.length === 0 && setupScore >= 4) {
            recommendations.push('✅ Setup ผ่านเกณฑ์ทุกข้อ พร้อมเทรดได้!');
        } else if (setupScore <= 2) {
            recommendations.push('🛑 ปรับปรุง Setup ก่อนเทรด');
        }

        return {
            // From Quant calculation
            riskAmount: metrics.riskAmount,
            positionSize: metrics.calculatedPositionSize,
            requiredMargin: metrics.requiredMargin,
            quantity: metrics.quantity,
            maxWin: metrics.grossWin,
            maxWinAfterFee: metrics.netMaxWin,
            maxLoss: metrics.grossLoss,
            maxLossWithFee: metrics.netMaxLoss,
            riskRewardRatio: metrics.riskRewardRatio,
            totalFee: metrics.totalFee,
            weightedSLDistance: metrics.weightedSLDistance,
            weightedTPDistance: metrics.weightedTPDistance,
            marginExceedsPortfolio: metrics.marginExceedsPortfolio,
            isValid: metrics.isValid,
            // AI Score
            setupScore,
            scoreBreakdown,
            warnings,
            recommendations,
            totalPoints,
            maxTotalPoints: 100,
        };
    }, [inputs, feeRate, tpTotal, slTotal]);

    // TP/SL Management
    const addTPLevel = () => {
        const remaining = 100 - tpTotal;
        if (remaining <= 0) return;
        setInputs(prev => ({
            ...prev,
            tpLevels: [...prev.tpLevels, { id: Date.now().toString(), price: 0, percent: remaining }]
        }));
    };

    const removeTPLevel = (id: string) => {
        if (inputs.tpLevels.length === 1) return;
        setInputs(prev => {
            const newLevels = prev.tpLevels.filter(tp => tp.id !== id);
            if (newLevels.length === 1) newLevels[0].percent = 100;
            return { ...prev, tpLevels: newLevels };
        });
    };

    const addSLLevel = () => {
        const remaining = 100 - slTotal;
        if (remaining <= 0) return;
        setInputs(prev => ({
            ...prev,
            slLevels: [...prev.slLevels, { id: Date.now().toString(), price: 0, percent: remaining }]
        }));
    };

    const removeSLLevel = (id: string) => {
        if (inputs.slLevels.length === 1) return;
        setInputs(prev => {
            const newLevels = prev.slLevels.filter(sl => sl.id !== id);
            if (newLevels.length === 1) newLevels[0].percent = 100;
            return { ...prev, slLevels: newLevels };
        });
    };

    const handleSave = async () => {
        // Validate pair format (should be XXX/XXX format, max 20 chars)
        const pairPattern = /^[A-Z0-9]{1,10}\/[A-Z0-9]{1,10}$/;
        if (!inputs.pair || !pairPattern.test(inputs.pair)) {
            setError('❌ คู่เทรดต้องเป็นรูปแบบ XXX/USDT เช่น BTC/USDT');
            return;
        }

        if (inputs.entryPrice <= 0 || calculation.positionSize <= 0) {
            setError('กรุณากรอกข้อมูลให้ครบก่อนบันทึก');
            return;
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            setError('กรุณาเข้าสู่ระบบก่อนบันทึก');
            return;
        }

        if (tpTotal !== 100 || slTotal !== 100) {
            setError('TP และ SL ต้องรวมครบ 100%');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const reason = inputs.entryReason === 'Custom...' ? inputs.customReason : inputs.entryReason;

            await tradeAPI.create({
                pair: inputs.pair,
                side: inputs.side,
                entry_price: inputs.entryPrice,
                stop_loss: inputs.slLevels[0]?.price || 0,
                take_profit: inputs.tpLevels[0]?.price || 0,
                position_size: calculation.positionSize,
                quantity: calculation.quantity,
                leverage: inputs.leverage,
                risk_percent: inputs.riskPercent,
                max_win: calculation.maxWinAfterFee,
                max_loss: calculation.maxLossWithFee,
                risk_reward_ratio: calculation.riskRewardRatio,
                fee: calculation.totalFee,
                entry_reason: reason,
                setup_score: calculation.setupScore,
                notes: `Exchange: ${inputs.exchange} | TPs: ${inputs.tpLevels.map((tp, i) => `TP${i + 1}@${formatPrice(tp.price)}(${tp.percent}%)`).join(', ')} | SLs: ${inputs.slLevels.map((sl, i) => `SL${i + 1}@${formatPrice(sl.price)}(${sl.percent}%)`).join(', ')}`,
            });

            setShowSuccessModal(true);
        } catch (err: any) {
            console.error('❌ Save trade error:', err);

            // Check for auth/token errors
            if (err.response?.status === 401 ||
                err.response?.data?.message?.includes('token') ||
                err.response?.data?.error?.includes('Token')) {
                setError('🔓 Token หมดอายุหรือไม่ถูกต้อง - กรุณา Login ใหม่');
                // Clear invalid token
                localStorage.removeItem('token');
                localStorage.removeItem('username');
            } else if (err.response?.status === 500) {
                const msg = err.response?.data?.message || err.response?.data?.error;
                setError(`❌ Server Error: ${msg || 'ไม่สามารถบันทึกได้'}`);
            } else {
                setError(err.response?.data?.error || 'ไม่สามารถบันทึกได้');
            }
        } finally {
            setSaving(false);
        }
    };

    const renderStars = (score: number) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={cn(
                        'w-6 h-6 transition-all',
                        i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'
                    )}
                />
            ))}
        </div>
    );

    const canSave = inputs.entryPrice > 0 && tpTotal === 100 && slTotal === 100 && calculation.positionSize > 0;

    return (
        <div className="bg-[#0a0e14] rounded-2xl p-4 sm:p-6 border border-[#1e2430] shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <CalcIcon className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Position Calculator</h2>
                    <p className="text-xs sm:text-sm text-gray-500">คำนวณ Multi-TP/SL พร้อม AI Score</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                {/* === Left Column === */}
                <div className="space-y-4">
                    {/* Pair + Side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative pair-dropdown-container">
                            <label className="block text-xs font-medium mb-2 text-gray-400">🪙 คู่เทรด</label>
                            <input
                                type="text"
                                value={inputs.pair}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    setInputs(p => ({ ...p, pair: value }));
                                    setPairSearch(value);
                                    setShowPairDropdown(true);
                                }}
                                onFocus={() => setShowPairDropdown(true)}
                                placeholder="พิมพ์ค้นหา... BTC, AI, Meme, DeFi"
                                className="w-full px-4 py-3 rounded-xl bg-[#161b22] border border-[#30363d] focus:border-accent outline-none text-white font-bold"
                            />

                            <AnimatePresence>
                                {showPairDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-50 w-full mt-2 bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden shadow-xl"
                                    >
                                        <div className="max-h-64 overflow-y-auto">
                                            {/* Search hint */}
                                            <div className="px-3 py-2 text-xs text-gray-500 border-b border-[#30363d] bg-[#0d1117]">
                                                💡 ค้นหาด้วย: ชื่อเหรียญ, หมวดหมู่ (AI, Meme, DeFi) หรือ Keywords
                                            </div>

                                            {filteredPairs.map((pair) => (
                                                <button
                                                    key={pair.symbol}
                                                    onClick={() => {
                                                        setInputs(p => ({ ...p, pair: pair.symbol }));
                                                        setPairSearch('');
                                                        setShowPairDropdown(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-4 py-2.5 text-left hover:bg-accent/20 transition-all flex items-center justify-between',
                                                        inputs.pair === pair.symbol && 'bg-accent/30'
                                                    )}
                                                >
                                                    <span className={cn(
                                                        'font-medium',
                                                        inputs.pair === pair.symbol ? 'text-accent' : 'text-white'
                                                    )}>
                                                        {pair.symbol}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                                                        {pair.category}
                                                    </span>
                                                </button>
                                            ))}

                                            {/* Custom pair option */}
                                            {inputs.pair && !TRADING_PAIRS.includes(inputs.pair) && inputs.pair.includes('/') && (
                                                <button
                                                    onClick={() => setShowPairDropdown(false)}
                                                    className="w-full px-4 py-2.5 text-left bg-green-900/30 text-green-400 flex items-center gap-2 border-t border-[#30363d]"
                                                >
                                                    <span>✨</span>
                                                    <span>เพิ่มคู่ใหม่: <strong>{inputs.pair}</strong></span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/30">Custom</span>
                                                </button>
                                            )}

                                            {/* No results */}
                                            {filteredPairs.length === 0 && (
                                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                    ไม่พบคู่เทรด - พิมพ์รูปแบบ XXX/USDT เพื่อเพิ่มใหม่
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-2 text-gray-400">📈 ทิศทาง</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setInputs(p => ({ ...p, side: 'LONG' }))}
                                    className={cn(
                                        'py-3 rounded-xl font-bold text-sm transition-all',
                                        inputs.side === 'LONG'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                                            : 'bg-[#161b22] border border-[#30363d] text-gray-400'
                                    )}
                                >
                                    LONG
                                </button>
                                <button
                                    onClick={() => setInputs(p => ({ ...p, side: 'SHORT' }))}
                                    className={cn(
                                        'py-3 rounded-xl font-bold text-sm transition-all',
                                        inputs.side === 'SHORT'
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                            : 'bg-[#161b22] border border-[#30363d] text-gray-400'
                                    )}
                                >
                                    SHORT
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio + Entry */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-[#30363d]">
                            <label className="block text-xs text-gray-500 mb-1">💰 Portfolio</label>
                            <input
                                type="number"
                                value={inputs.portfolio || ''}
                                onChange={(e) => setInputs(p => ({ ...p, portfolio: parseFloat(e.target.value) || 0 }))}
                                className="w-full text-xl sm:text-2xl font-bold bg-transparent outline-none"
                                placeholder="1000"
                            />
                        </div>
                        <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-accent/30">
                            <label className="block text-xs text-gray-500 mb-1">🎯 Entry Price</label>
                            <input
                                type="number"
                                step="any"
                                value={inputs.entryPrice || ''}
                                onChange={(e) => setInputs(p => ({ ...p, entryPrice: parseFloat(e.target.value) || 0 }))}
                                className="w-full text-xl sm:text-2xl font-bold bg-transparent outline-none text-accent"
                                placeholder="43500"
                            />
                        </div>
                    </div>

                    {/* Risk Slider */}
                    <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-[#30363d]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">📊 Risk: <span className="text-white font-bold">{inputs.riskPercent.toFixed(1)}%</span></span>
                            <span className={cn(
                                'px-2 py-1 rounded text-xs font-bold',
                                inputs.riskPercent <= 2 ? 'bg-green-600/30 text-green-400' :
                                    inputs.riskPercent <= 5 ? 'bg-yellow-500/30 text-yellow-400' :
                                        'bg-red-600/30 text-red-400'
                            )}>
                                {inputs.riskPercent <= 2 ? '✅ Safe' : inputs.riskPercent <= 5 ? '⚠️ Moderate' : '🔥 Risky'}
                            </span>
                        </div>
                        <input
                            type="range" min="0.1" max="20" step="0.1"
                            value={inputs.riskPercent}
                            onChange={(e) => setInputs(p => ({ ...p, riskPercent: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-[#30363d] rounded-full appearance-none cursor-pointer accent-accent"
                        />
                    </div>

                    {/* Leverage Slider */}
                    <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-[#30363d]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-400">⚡ Leverage: <span className="text-white font-bold">{inputs.leverage}x</span></span>
                            <span className={cn(
                                'px-2 py-1 rounded text-xs font-bold',
                                inputs.leverage <= 10 ? 'bg-green-600/30 text-green-400' :
                                    inputs.leverage <= 25 ? 'bg-yellow-500/30 text-yellow-400' :
                                        'bg-red-600/30 text-red-400'
                            )}>
                                {inputs.leverage <= 10 ? '✅ Low' : inputs.leverage <= 25 ? '⚠️ Med' : '💀 High'}
                            </span>
                        </div>
                        <input
                            type="range" min="1" max="125" step="1"
                            value={inputs.leverage}
                            onChange={(e) => setInputs(p => ({ ...p, leverage: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-[#30363d] rounded-full appearance-none cursor-pointer accent-accent"
                        />
                    </div>

                    {/* SL Levels */}
                    <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-red-900/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className={cn(
                                'text-sm font-medium',
                                slTotal === 100 ? 'text-red-400' : 'text-red-300'
                            )}>
                                🛡️ Stop Loss ({slTotal}%)
                                {slTotal !== 100 && <span className="text-xs ml-2">(ต้องครบ 100%)</span>}
                            </span>
                            {slTotal < 100 && (
                                <button onClick={addSLLevel} className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400">
                                    <Plus className="w-3 h-3 inline" /> เพิ่ม
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {inputs.slLevels.map((sl, idx) => {
                                const distance = getDistancePercent(sl.price, false);
                                return (
                                    <div key={sl.id} className="flex gap-2 items-center">
                                        <span className="text-xs text-gray-500 w-6">SL{idx + 1}</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number" step="any"
                                                placeholder={inputs.side === 'LONG' ? 'ต่ำกว่า Entry' : 'สูงกว่า Entry'}
                                                value={sl.price || ''}
                                                onChange={(e) => {
                                                    const levels = [...inputs.slLevels];
                                                    levels[idx].price = parseFloat(e.target.value) || 0;
                                                    setInputs(p => ({ ...p, slLevels: levels }));
                                                }}
                                                className="w-full px-3 py-2 text-sm rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none pr-16"
                                            />
                                            {distance > 0 && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400">
                                                    -{distance.toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="number" min="0" max="100"
                                            value={sl.percent || ''}
                                            onChange={(e) => {
                                                const levels = [...inputs.slLevels];
                                                levels[idx].percent = Math.min(100, parseFloat(e.target.value) || 0);
                                                setInputs(p => ({ ...p, slLevels: levels }));
                                            }}
                                            className="w-14 px-2 py-2 text-sm rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none text-center"
                                        />
                                        <span className="text-xs text-gray-500">%</span>
                                        {inputs.slLevels.length > 1 && (
                                            <button onClick={() => removeSLLevel(sl.id)} className="text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* TP Levels */}
                    <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-green-900/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className={cn(
                                'text-sm font-medium',
                                tpTotal === 100 ? 'text-green-400' : 'text-green-300'
                            )}>
                                🎯 Take Profit ({tpTotal}%)
                                {tpTotal !== 100 && <span className="text-xs ml-2">(ต้องครบ 100%)</span>}
                            </span>
                            {tpTotal < 100 && (
                                <button onClick={addTPLevel} className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400">
                                    <Plus className="w-3 h-3 inline" /> เพิ่ม
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {inputs.tpLevels.map((tp, idx) => {
                                const distance = getDistancePercent(tp.price, true);
                                return (
                                    <div key={tp.id} className="flex gap-2 items-center">
                                        <span className="text-xs text-gray-500 w-6">TP{idx + 1}</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number" step="any"
                                                placeholder={inputs.side === 'LONG' ? 'สูงกว่า Entry' : 'ต่ำกว่า Entry'}
                                                value={tp.price || ''}
                                                onChange={(e) => {
                                                    const levels = [...inputs.tpLevels];
                                                    levels[idx].price = parseFloat(e.target.value) || 0;
                                                    setInputs(p => ({ ...p, tpLevels: levels }));
                                                }}
                                                className="w-full px-3 py-2 text-sm rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none pr-16"
                                            />
                                            {distance > 0 && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-400">
                                                    +{distance.toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="number" min="0" max="100"
                                            value={tp.percent || ''}
                                            onChange={(e) => {
                                                const levels = [...inputs.tpLevels];
                                                levels[idx].percent = Math.min(100, parseFloat(e.target.value) || 0);
                                                setInputs(p => ({ ...p, tpLevels: levels }));
                                            }}
                                            className="w-14 px-2 py-2 text-sm rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none text-center"
                                        />
                                        <span className="text-xs text-gray-500">%</span>
                                        {inputs.tpLevels.length > 1 && (
                                            <button onClick={() => removeTPLevel(tp.id)} className="text-green-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Exchange + Reason */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-[#30363d]">
                            <label className="block text-xs text-gray-500 mb-2">💰 Exchange</label>
                            <select
                                value={inputs.exchange}
                                onChange={(e) => setInputs(p => ({ ...p, exchange: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none text-sm"
                            >
                                {EXCHANGES.map(ex => (
                                    <option key={ex.name} value={ex.name}>
                                        {ex.name} {ex.name !== 'Custom' && `(${ex.takerFee}%)`}
                                    </option>
                                ))}
                            </select>
                            {inputs.exchange === 'Custom' && (
                                <input
                                    type="number" step="0.01"
                                    value={inputs.customFee}
                                    onChange={(e) => setInputs(p => ({ ...p, customFee: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Fee %"
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none text-sm"
                                />
                            )}
                        </div>

                        <div className="bg-[#161b22] p-3 sm:p-4 rounded-xl border border-[#30363d]">
                            <label className="block text-xs text-gray-500 mb-2">📝 เหตุผล</label>
                            <select
                                value={inputs.entryReason}
                                onChange={(e) => setInputs(p => ({ ...p, entryReason: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none text-sm"
                            >
                                <option value="">-- เลือก --</option>
                                {ENTRY_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            {inputs.entryReason === 'Custom...' && (
                                <input
                                    type="text"
                                    value={inputs.customReason}
                                    onChange={(e) => setInputs(p => ({ ...p, customReason: e.target.value }))}
                                    placeholder="พิมพ์เหตุผล..."
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#0a0e14] border border-[#30363d] outline-none text-sm"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* === Right Column === */}
                <div className="space-y-4">
                    {/* AI Trade Score (Detailed) */}
                    <div className={cn(
                        'p-4 sm:p-5 rounded-xl border-2',
                        calculation.setupScore >= 4 ? 'bg-green-900/20 border-green-600/50' :
                            calculation.setupScore >= 3 ? 'bg-yellow-900/20 border-yellow-600/50' :
                                'bg-red-900/20 border-red-600/50'
                    )}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-400" />
                                <span className="font-bold">AI Trade Score</span>
                                <span className="text-xs text-gray-500">({calculation.totalPoints}/{calculation.maxTotalPoints} pts)</span>
                            </div>
                            {renderStars(calculation.setupScore)}
                        </div>

                        {/* Score Breakdown */}
                        <div className="space-y-1.5 mb-3">
                            {calculation.scoreBreakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <span className={cn(
                                        item.status === 'good' ? 'text-green-400' :
                                            item.status === 'warn' ? 'text-yellow-400' :
                                                'text-red-400'
                                    )}>
                                        {item.status === 'good' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'} {item.label}
                                    </span>
                                    <span className="text-gray-500">{item.points}/{item.maxPoints}</span>
                                </div>
                            ))}
                        </div>

                        {/* Warnings */}
                        {calculation.warnings.length > 0 && (
                            <div className="space-y-1 border-t border-gray-700 pt-3 mb-3">
                                {calculation.warnings.map((w, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1.5 rounded">
                                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <span>{w}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recommendations */}
                        {calculation.recommendations.length > 0 && (
                            <div className="space-y-1">
                                {calculation.recommendations.map((r, i) => (
                                    <div key={i} className="text-xs text-gray-300 bg-gray-800/50 px-2 py-1.5 rounded">
                                        {r}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Position Size */}
                    <div className={cn(
                        "bg-[#161b22] rounded-xl p-4 sm:p-5 border",
                        calculation.marginExceedsPortfolio ? 'border-red-600' : 'border-accent/50'
                    )}>
                        <div className="text-xs text-gray-400 mb-1">Position Size</div>
                        <div className="text-2xl sm:text-3xl font-bold text-accent">
                            ${formatPrice(calculation.positionSize)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            {formatPrice(calculation.quantity)} {inputs.pair.split('/')[0]}
                        </div>
                    </div>

                    {/* 🆕 Required Margin (เงินต้นที่ต้องวาง) */}
                    <div className={cn(
                        "bg-[#161b22] rounded-xl p-4 sm:p-5 border",
                        calculation.marginExceedsPortfolio ? 'border-red-600 bg-red-900/20' : 'border-purple-600/50'
                    )}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-xs text-gray-400 mb-1">💰 เงินต้นที่ต้องวาง (Margin)</div>
                                <div className={cn(
                                    "text-xl sm:text-2xl font-bold",
                                    calculation.marginExceedsPortfolio ? 'text-red-400' : 'text-purple-400'
                                )}>
                                    ${formatPrice(calculation.requiredMargin || 0)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Position ÷ {inputs.leverage}x Leverage
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">คงเหลือหลังวาง</div>
                                <div className={cn(
                                    "text-sm font-bold",
                                    (inputs.portfolio - (calculation.requiredMargin || 0)) >= 0 ? 'text-green-400' : 'text-red-400'
                                )}>
                                    ${formatPrice(Math.max(0, inputs.portfolio - (calculation.requiredMargin || 0)))}
                                </div>
                            </div>
                        </div>
                        {calculation.marginExceedsPortfolio && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-900/50 px-3 py-2 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                                <span>⚠️ Margin เกิน Portfolio! ลด Risk% หรือเพิ่ม Leverage</span>
                            </div>
                        )}
                    </div>

                    {/* Risk/Reward Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#161b22] rounded-xl p-3 sm:p-4 border border-red-600/50">
                            <div className="text-xs text-gray-400 mb-1">Max Loss</div>
                            <div className="text-xl sm:text-2xl font-bold text-red-400">
                                -${formatPrice(calculation.maxLossWithFee)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Risk + Fee
                            </div>
                        </div>
                        <div className="bg-[#161b22] rounded-xl p-3 sm:p-4 border border-green-600/50">
                            <div className="text-xs text-gray-400 mb-1">Max Win</div>
                            <div className="text-xl sm:text-2xl font-bold text-green-400">
                                +${formatPrice(calculation.maxWinAfterFee)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                After Fee
                            </div>
                        </div>
                    </div>

                    {/* R:R + Fee */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#161b22] rounded-xl p-3 sm:p-4 border border-[#30363d]">
                            <div className="text-xs text-gray-400 mb-1">R:R (Net)</div>
                            <div className="text-2xl font-bold">
                                1:<span className={cn(
                                    calculation.riskRewardRatio >= 2 ? 'text-green-400' :
                                        calculation.riskRewardRatio >= 1 ? 'text-yellow-400' :
                                            'text-red-400'
                                )}>{calculation.riskRewardRatio.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="bg-[#161b22] rounded-xl p-3 sm:p-4 border border-[#30363d]">
                            <div className="text-xs text-gray-400 mb-1">Total Fee</div>
                            <div className="text-xl font-bold">${formatPrice(calculation.totalFee)}</div>
                            <div className="text-xs text-gray-500">{feeRate}% × 2</div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 text-red-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Save Button */}
                    <motion.button
                        whileHover={{ scale: canSave ? 1.02 : 1 }}
                        whileTap={{ scale: canSave ? 0.98 : 1 }}
                        onClick={handleSave}
                        disabled={saving || !canSave}
                        className={cn(
                            'w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all',
                            canSave
                                ? 'bg-gradient-to-r from-accent to-green-500 text-white hover:shadow-lg hover:shadow-accent/30'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        )}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                💾 Save Trade Plan
                            </>
                        )}
                    </motion.button>

                    {!canSave && inputs.entryPrice > 0 && (
                        <p className="text-center text-xs text-gray-500">
                            {tpTotal !== 100 && `TP ต้องครบ 100% (ตอนนี้ ${tpTotal}%)`}
                            {tpTotal !== 100 && slTotal !== 100 && ' | '}
                            {slTotal !== 100 && `SL ต้องครบ 100% (ตอนนี้ ${slTotal}%)`}
                        </p>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setShowSuccessModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#161b22] rounded-2xl p-6 sm:p-8 border border-green-600/50 w-full max-w-md text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">บันทึกสำเร็จ! 🎉</h3>
                            <p className="text-gray-400 mb-6">
                                บันทึกแผนการเทรด {inputs.pair} เรียบร้อยแล้ว
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#30363d] text-gray-300 font-medium hover:bg-[#3d444d] transition-all"
                                >
                                    ปิด
                                </button>
                                <Link
                                    href="/dashboard"
                                    className="flex-1 py-3 rounded-xl bg-accent text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-1"
                                >
                                    ไปดูประวัติ <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
