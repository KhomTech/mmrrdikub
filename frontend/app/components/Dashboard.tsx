'use client';
/**
 * Dashboard.tsx - PRODUCTION Trading Dashboard
 * 🔥 FINAL: UTF-8 BOM Export, Dynamic Formatting, Mobile Scroll Hint
 * ✅ Multi-Language Support + Theme Support
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tradeAPI, Trade, TradeStats } from '../utils/api';
import { formatPrice, formatUSD, formatPercent, formatPnL } from '../utils/format';
import { cn } from '../lib/cn';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    BarChart3,
    Search,
    Calendar,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Edit3,
    Trash2,
    X,
    Lock,
    LogIn,
    Star,
    Loader2,
    Check,
    RefreshCw,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Clock,
    MessageSquare,
    DollarSign,
    Target,
    Download,
    PieChart,
    TrendingUp,
    TrendingDown,
    ChevronRight as ScrollHint,
    FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

interface SortConfig {
    key: keyof Trade | null;
    direction: 'ASC' | 'DESC';
}

interface EditModalData {
    trade: Trade;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    status: string;
    exitTime: string;
    tpHit: string;
    slHit: string;
    notes: string;
}

export default function Dashboard() {
    const { t } = useLanguage();
    const { theme } = useTheme();

    // Auth
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    // Data
    const [trades, setTrades] = useState<Trade[]>([]);
    const [stats, setStats] = useState<TradeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sideFilter, setSideFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'DESC' });
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Modal
    const [editModal, setEditModal] = useState<EditModalData | null>(null);
    const [saving, setSaving] = useState(false);

    // Export
    const [exporting, setExporting] = useState(false);

    // Check Login
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('username');
            setIsLoggedIn(!!token);
            setUsername(user || '');
        }
    }, []);

    // Fetch Trades
    const fetchTrades = async () => {
        if (!isLoggedIn) return;

        setLoading(true);
        setError('');

        try {
            const response = await tradeAPI.getAll({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                side: sideFilter !== 'all' ? sideFilter : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                sort_by: sortConfig.key || 'created_at',
                sort_dir: sortConfig.direction,
                limit: 200,
            });

            setTrades(response.data.trades || []);
            setStats(response.data.stats);
        } catch (err: any) {
            setError(err.response?.data?.error || t('serverError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, [isLoggedIn, statusFilter, sideFilter, dateFrom, dateTo, sortConfig]);

    // Universal Search (ALL fields)
    const filteredTrades = useMemo(() => {
        if (!searchQuery.trim()) return trades;

        const query = searchQuery.toLowerCase();
        return trades.filter(t => {
            return (
                t.pair.toLowerCase().includes(query) ||
                t.side.toLowerCase().includes(query) ||
                t.status.toLowerCase().includes(query) ||
                (t.entry_reason || '').toLowerCase().includes(query) ||
                (t.notes || '').toLowerCase().includes(query) ||
                t.entry_price.toString().includes(query) ||
                t.position_size.toString().includes(query) ||
                (t.pnl || 0).toString().includes(query)
            );
        });
    }, [trades, searchQuery]);

    const paginatedTrades = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        return filteredTrades.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredTrades, page]);

    const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);

    const handleSort = (key: keyof Trade) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'DESC' ? 'ASC' : 'DESC'
        }));
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            await tradeAPI.delete(id);
            fetchTrades();
        } catch (err: any) {
            alert(err.response?.data?.error || t('deleteFailed'));
        }
    };

    const handleEditSubmit = async () => {
        if (!editModal) return;
        setSaving(true);
        try {
            await tradeAPI.update(editModal.trade.id, {
                exit_price: editModal.exitPrice,
                pnl: editModal.pnl,
                pnl_percent: editModal.pnlPercent,
                status: editModal.status,
                notes: `${editModal.notes} | ${editModal.status === 'WIN' ? `Hit: ${editModal.tpHit}` : editModal.status === 'LOSS' ? `Hit: ${editModal.slHit}` : ''}`.trim(),
                exit_time: editModal.exitTime ? new Date(editModal.exitTime).toISOString() : undefined,
            });
            setEditModal(null);
            fetchTrades();
        } catch (err: any) {
            alert(err.response?.data?.error || t('updateFailed'));
        } finally {
            setSaving(false);
        }
    };

    const updateExitPrice = (newExitPrice: number) => {
        if (!editModal) return;
        const trade = editModal.trade;
        let pnl = 0;
        let pnlPercent = 0;

        if (newExitPrice > 0 && trade.entry_price > 0) {
            if (trade.side === 'LONG') {
                pnlPercent = ((newExitPrice - trade.entry_price) / trade.entry_price) * 100;
                pnl = (pnlPercent / 100) * trade.position_size;
            } else {
                pnlPercent = ((trade.entry_price - newExitPrice) / trade.entry_price) * 100;
                pnl = (pnlPercent / 100) * trade.position_size;
            }
        }

        let status = 'OPEN';
        if (pnl > 0) status = 'WIN';
        else if (pnl < 0) status = 'LOSS';
        else if (pnl === 0 && newExitPrice > 0) status = 'BREAK_EVEN';

        setEditModal(prev => prev ? {
            ...prev,
            exitPrice: newExitPrice,
            pnl: pnl - (trade.fee || 0),
            pnlPercent,
            status,
        } : null);
    };

    // ============================================
    // Export to CSV with UTF-8 BOM (Thai Support)
    // ============================================
    const exportToCSV = async () => {
        if (filteredTrades.length === 0) {
            alert(t('noData'));
            return;
        }

        setExporting(true);

        // Simulate async for UX
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const headers = [
                'ID', 'Date', 'Pair', 'Side', 'Entry', 'Exit', 'Size',
                'PnL', 'PnL%', 'Status', 'R:R', 'Score', 'Reason', 'Notes'
            ];

            const rows = filteredTrades.map(t => [
                t.id,
                new Date(t.created_at).toLocaleDateString('th-TH'),
                t.pair,
                t.side,
                t.entry_price,
                t.exit_price || '',
                t.position_size.toFixed(2),
                t.pnl?.toFixed(2) || '',
                t.pnl_percent?.toFixed(2) || '',
                t.status,
                t.risk_reward_ratio?.toFixed(2) || '',
                t.setup_score || '',
                (t.entry_reason || '').replace(/,/g, ';'),
                (t.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // UTF-8 BOM for Thai language support in Excel
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `trade_history_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    // Stats
    const winRate = useMemo(() => {
        if (!stats) return 0;
        const total = stats.win_count + stats.loss_count;
        return total > 0 ? (stats.win_count / total) * 100 : 0;
    }, [stats]);

    const pieData = useMemo(() => {
        if (!stats) return { win: 0, loss: 0, open: 0 };
        const total = stats.win_count + stats.loss_count + stats.open_count;
        return {
            win: total > 0 ? (stats.win_count / total) * 100 : 0,
            loss: total > 0 ? (stats.loss_count / total) * 100 : 0,
            open: total > 0 ? (stats.open_count / total) * 100 : 0,
        };
    }, [stats]);

    const renderStars = (score: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={cn(
                        'w-3 h-3',
                        i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'
                    )}
                />
            ))}
        </div>
    );

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('th-TH', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    // Not Logged In
    if (!isLoggedIn) {
        return (
            <div className="relative">
                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-2xl p-6 border border-gray-200 dark:border-[var(--border)] opacity-30 blur-sm pointer-events-none">
                    <div className="h-96 flex items-center justify-center">
                        <BarChart3 className="w-16 h-16 text-gray-700" />
                    </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[var(--surface)] rounded-2xl p-8 border-2 border-accent/50 text-center max-w-md"
                    >
                        <Lock className="w-12 h-12 mx-auto mb-4 text-accent" />
                        <h2 className="text-2xl font-bold mb-2">🔒 Pro Analytics</h2>
                        <p className="text-gray-400 mb-6">{t('pleaseLogin')}</p>
                        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-bold">
                            <LogIn className="w-5 h-5" /> {t('login')}
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">{t('tradeJournal')}</h2>
                        <p className="text-xs sm:text-sm text-gray-400">{t('welcome')}, {username}! 🚀</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        disabled={exporting}
                        className={cn(
                            'px-3 sm:px-4 py-2 rounded-xl border transition-all flex items-center gap-2 text-sm',
                            exporting
                                ? 'bg-green-600/30 border-green-600/50 text-green-400'
                                : 'bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30'
                        )}
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">{t('downloading')}</span>
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('exportCsv')}</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={fetchTrades}
                        disabled={loading}
                        className="px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] hover:border-accent transition-all flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        <span className="hidden sm:inline">{t('refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Stats + Pie */}
            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-[var(--surface)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                        <div className="text-xs text-gray-500 mb-1">Total PnL</div>
                        <div className={cn(
                            'text-lg sm:text-2xl font-bold',
                            (stats?.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                            {formatUSD(stats?.total_pnl || 0)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[var(--surface)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                        <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                        <div className={cn('text-lg sm:text-2xl font-bold', winRate >= 50 ? 'text-green-400' : 'text-red-400')}>
                            {formatPercent(winRate)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[var(--surface)] rounded-xl p-3 sm:p-4 border border-green-600/30">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Wins
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-green-400">{stats?.win_count || 0}</div>
                    </div>
                    <div className="bg-white dark:bg-[var(--surface)] rounded-xl p-3 sm:p-4 border border-red-600/30">
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Losses
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-red-400">{stats?.loss_count || 0}</div>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-[var(--surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--border)]">
                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                        <PieChart className="w-3 h-3" /> {t('summaryWinLoss')}
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="#0a0e14" stroke="#30363d" strokeWidth="2" />
                                {pieData.win > 0 && (
                                    <circle cx="50" cy="50" r="35" fill="transparent" stroke="#22c55e" strokeWidth="20"
                                        strokeDasharray={`${pieData.win * 2.2} ${220 - pieData.win * 2.2}`} strokeDashoffset="0" />
                                )}
                                {pieData.loss > 0 && (
                                    <circle cx="50" cy="50" r="35" fill="transparent" stroke="#ef4444" strokeWidth="20"
                                        strokeDasharray={`${pieData.loss * 2.2} ${220 - pieData.loss * 2.2}`}
                                        strokeDashoffset={`${-pieData.win * 2.2}`} />
                                )}
                                {pieData.open > 0 && (
                                    <circle cx="50" cy="50" r="35" fill="transparent" stroke="#eab308" strokeWidth="20"
                                        strokeDasharray={`${pieData.open * 2.2} ${220 - pieData.open * 2.2}`}
                                        strokeDashoffset={`${-(pieData.win + pieData.loss) * 2.2}`} />
                                )}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-center">
                                <div>
                                    <div className="text-lg font-bold">{trades.length}</div>
                                    <div className="text-xs text-gray-500">{t('total')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-3 sm:gap-4 mt-3 text-xs flex-wrap">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                            <span>Win {pieData.win.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                            <span>Loss {pieData.loss.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                            <span>Open {pieData.open.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[var(--surface)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder={`🔍 ${t('searchAll')}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] focus:border-accent outline-none text-sm"
                            />
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm"
                    >
                        <option value="all">All</option>
                        <option value="OPEN">🟡 Open</option>
                        <option value="WIN">🟢 Win</option>
                        <option value="LOSS">🔴 Loss</option>
                    </select>
                    <select
                        value={sideFilter}
                        onChange={(e) => setSideFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm"
                    >
                        <option value="all">All</option>
                        <option value="LONG">📈 Long</option>
                        <option value="SHORT">📉 Short</option>
                    </select>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 hidden sm:block" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-2 sm:px-3 py-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm w-32 sm:w-auto"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-2 sm:px-3 py-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm w-32 sm:w-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-900/30 text-red-400">
                    <AlertTriangle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Table with Mobile Scroll Hint */}
            <div className="bg-white dark:bg-[var(--surface)] rounded-xl border border-gray-200 dark:border-[var(--border)] overflow-hidden">
                {/* Mobile Scroll Hint */}
                <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-[var(--background)] text-xs text-gray-500 border-b border-gray-200 dark:border-[var(--border)]">
                    <span>👈 {t('scrollHint')}</span>
                    <ScrollHint className="w-4 h-4 animate-pulse" />
                </div>

                <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-[#30363d] scrollbar-track-[#0a0e14]">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-gray-50 dark:bg-[var(--background)] border-b border-gray-200 dark:border-[var(--border)]">
                            <tr>
                                {[
                                    { key: 'created_at', label: '⏰ Time' },
                                    { key: 'pair', label: '🪙 Pair' },
                                    { key: 'side', label: '📈 Side' },
                                    { key: 'entry_price', label: '💰 Entry' },
                                    { key: 'position_size', label: '📊 Size' },
                                    { key: 'risk_reward_ratio', label: '⚖️ R:R' },
                                    { key: 'setup_score', label: '⭐ Score' },
                                    { key: 'entry_reason', label: '📝 Reason' },
                                    { key: 'pnl', label: '💵 PnL' },
                                    { key: 'status', label: '🎯 Status' },
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key as keyof Trade)}
                                        className="px-3 py-3 text-left text-xs font-medium text-gray-400 cursor-pointer hover:text-white transition-all whitespace-nowrap"
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {sortConfig.key === col.key ? (
                                                sortConfig.direction === 'DESC' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-xs font-medium text-gray-400 sticky right-0 bg-gray-50 dark:bg-[var(--background)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
                                    </td>
                                </tr>
                            ) : paginatedTrades.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                                        {searchQuery ? `${t('noResults')} "${searchQuery}"` : t('noData')}
                                    </td>
                                </tr>
                            ) : (
                                paginatedTrades.map((trade) => {
                                    const pnlDisplay = formatPnL(trade.pnl);
                                    return (
                                        <tr key={trade.id} className="border-b border-gray-200 dark:border-[var(--border)] hover:bg-gray-50 dark:bg-[var(--background)] transition-all">
                                            <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                                                {formatDateTime(trade.entry_time || trade.created_at)}
                                            </td>
                                            <td className="px-3 py-3 font-medium whitespace-nowrap">{trade.pair}</td>
                                            <td className="px-3 py-3">
                                                <span className={cn(
                                                    'px-2 py-1 rounded text-xs font-bold',
                                                    trade.side === 'LONG' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                                                )}>
                                                    {trade.side}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-sm whitespace-nowrap">${formatPrice(trade.entry_price)}</td>
                                            <td className="px-3 py-3 text-sm whitespace-nowrap">${formatPrice(trade.position_size)}</td>
                                            <td className="px-3 py-3 text-sm">
                                                {trade.risk_reward_ratio > 0 ? (
                                                    <span className={cn(trade.risk_reward_ratio >= 2 ? 'text-green-400' : 'text-yellow-400')}>
                                                        1:{trade.risk_reward_ratio.toFixed(1)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-3 py-3">{renderStars(trade.setup_score)}</td>
                                            <td className="px-3 py-3 text-xs text-gray-400 max-w-[100px] truncate" title={trade.entry_reason}>
                                                {trade.entry_reason || '-'}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={cn('font-bold text-sm', pnlDisplay.colorClass)}>
                                                    {pnlDisplay.text}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={cn(
                                                    'px-2 py-1 rounded text-xs font-bold',
                                                    trade.status === 'WIN' ? 'bg-green-600/30 text-green-400' :
                                                        trade.status === 'LOSS' ? 'bg-red-600/30 text-red-400' :
                                                            trade.status === 'BREAK_EVEN' ? 'bg-gray-600/30 text-gray-400' :
                                                                'bg-yellow-600/30 text-yellow-400'
                                                )}>
                                                    {trade.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 sticky right-0 bg-white dark:bg-[var(--surface)]">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditModal({
                                                            trade,
                                                            exitPrice: trade.exit_price || trade.entry_price,
                                                            pnl: trade.pnl || 0,
                                                            pnlPercent: trade.pnl_percent || 0,
                                                            status: trade.status,
                                                            exitTime: trade.exit_time || '',
                                                            tpHit: '', slHit: '',
                                                            notes: trade.notes || '',
                                                        })}
                                                        className="p-1.5 rounded-lg hover:bg-accent/20 text-gray-400 hover:text-accent transition-all"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(trade.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[var(--border)]">
                        <div className="text-xs sm:text-sm text-gray-500">
                            {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, filteredTrades.length)} / {filteredTrades.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm px-2 sm:px-3">{page + 1}/{totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg bg-gray-50 dark:bg-[var(--background)] border border-gray-200 dark:border-[var(--border)] disabled:opacity-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => setEditModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[var(--border)] w-full max-w-lg my-8"
                        >
                            <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-bold">{t('editOrder')}</h3>
                                <button onClick={() => setEditModal(null)} className="p-1 rounded hover:bg-gray-200 dark:bg-[var(--border)]">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">{editModal.trade.pair}</span>
                                        <span className={cn(
                                            'px-3 py-1 rounded font-bold text-sm',
                                            editModal.trade.side === 'LONG' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                                        )}>
                                            {editModal.trade.side}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Entry: ${formatPrice(editModal.trade.entry_price)} | Size: ${formatPrice(editModal.trade.position_size)}
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                                    <label className="block text-xs text-gray-400 mb-2"><Clock className="w-3 h-3 inline" /> {t('closeTime')}</label>
                                    <input
                                        type="datetime-local"
                                        value={editModal.exitTime}
                                        onChange={(e) => setEditModal(prev => prev ? { ...prev, exitTime: e.target.value } : null)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm"
                                    />
                                </div>

                                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                                    <label className="block text-xs text-gray-400 mb-2"><Target className="w-3 h-3 inline" /> Exit Price</label>
                                    <input
                                        type="number" step="any"
                                        value={editModal.exitPrice || ''}
                                        onChange={(e) => updateExitPrice(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] outline-none text-lg font-bold"
                                        placeholder={t('exitPrice')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-green-600/30">
                                        <label className="block text-xs text-green-400 mb-2">{t('tpHit')}</label>
                                        <select
                                            value={editModal.tpHit}
                                            onChange={(e) => setEditModal(prev => prev ? { ...prev, tpHit: e.target.value } : null)}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm"
                                        >
                                            <option value="">--</option>
                                            <option value="TP1">TP1</option>
                                            <option value="TP2">TP2</option>
                                            <option value="TP3">TP3</option>
                                            <option value="All">All</option>
                                            <option value="Manual">Manual</option>
                                        </select>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-red-600/30">
                                        <label className="block text-xs text-red-400 mb-2">{t('slHit')}</label>
                                        <select
                                            value={editModal.slHit}
                                            onChange={(e) => setEditModal(prev => prev ? { ...prev, slHit: e.target.value } : null)}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm"
                                        >
                                            <option value="">--</option>
                                            <option value="SL1">SL1</option>
                                            <option value="SL2">SL2</option>
                                            <option value="All">All</option>
                                            <option value="Manual">Manual</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                                    <label className="block text-xs text-gray-400 mb-2"><DollarSign className="w-3 h-3 inline" /> {t('actualPnl')}</label>
                                    <input
                                        type="number" step="any"
                                        value={editModal.pnl || ''}
                                        onChange={(e) => setEditModal(prev => prev ? {
                                            ...prev,
                                            pnl: parseFloat(e.target.value) || 0,
                                            status: parseFloat(e.target.value) > 0 ? 'WIN' : parseFloat(e.target.value) < 0 ? 'LOSS' : 'BREAK_EVEN'
                                        } : null)}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border outline-none text-xl font-bold',
                                            editModal.pnl > 0 ? 'border-green-600/50 text-green-400' :
                                                editModal.pnl < 0 ? 'border-red-600/50 text-red-400' : 'border-gray-200 dark:border-[var(--border)]'
                                        )}
                                    />
                                </div>

                                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                                    <label className="block text-xs text-gray-400 mb-2">Status</label>
                                    <select
                                        value={editModal.status}
                                        onChange={(e) => setEditModal(prev => prev ? { ...prev, status: e.target.value } : null)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm"
                                    >
                                        <option value="OPEN">🟡 OPEN</option>
                                        <option value="WIN">🟢 WIN</option>
                                        <option value="LOSS">🔴 LOSS</option>
                                        <option value="BREAK_EVEN">⚪ BREAK EVEN</option>
                                    </select>
                                </div>

                                <div className="bg-gray-50 dark:bg-[var(--background)] rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-[var(--border)]">
                                    <label className="block text-xs text-gray-400 mb-2"><MessageSquare className="w-3 h-3 inline" /> Notes</label>
                                    <textarea
                                        value={editModal.notes}
                                        onChange={(e) => setEditModal(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[var(--surface)] border border-gray-200 dark:border-[var(--border)] outline-none text-sm resize-none"
                                        placeholder={t('notes')}
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleEditSubmit}
                                    disabled={saving}
                                    className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-accent to-green-500 text-white font-bold flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    {saving ? t('saving') : t('save')}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
