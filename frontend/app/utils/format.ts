/**
 * format.ts - Utility functions for number formatting
 * รองรับเหรียญราคาสูง (BTC) และราคาต่ำ (SHIB)
 */

/**
 * Format price dynamically based on value
 * - ถ้า >= 1: แสดง 2 ทศนิยม (เช่น 96,500.25)
 * - ถ้า < 1 && >= 0.01: แสดง 4 ทศนิยม (เช่น 0.5432)
 * - ถ้า < 0.01 && >= 0.0001: แสดง 6 ทศนิยม
 * - ถ้า < 0.0001: แสดง 8 ทศนิยม (เช่น 0.00001234)
 */
export function formatPrice(value: number | string | undefined | null): string {
    if (value === undefined || value === null || value === '') return '-';

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return '-';
    if (num === 0) return '0';

    const absNum = Math.abs(num);
    let decimals = 2;

    if (absNum < 0.0001) {
        decimals = 8;
    } else if (absNum < 0.01) {
        decimals = 6;
    } else if (absNum < 1) {
        decimals = 4;
    } else {
        decimals = 2;
    }

    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format price with currency symbol
 */
export function formatUSD(value: number | string | undefined | null): string {
    const formatted = formatPrice(value);
    if (formatted === '-') return formatted;

    const num = typeof value === 'string' ? parseFloat(value) : value || 0;
    const prefix = num >= 0 ? '$' : '-$';

    return prefix + formatPrice(Math.abs(num));
}

/**
 * Format percentage
 */
export function formatPercent(value: number | string | undefined | null, decimals = 2): string {
    if (value === undefined || value === null || value === '') return '-';

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return '-';

    return num.toFixed(decimals) + '%';
}

/**
 * Format quantity (supports very small amounts)
 */
export function formatQuantity(value: number | string | undefined | null): string {
    if (value === undefined || value === null || value === '') return '-';

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) return '-';
    if (num === 0) return '0';

    const absNum = Math.abs(num);

    if (absNum < 0.000001) {
        return num.toExponential(4);
    } else if (absNum < 1) {
        return num.toFixed(8);
    } else if (absNum < 1000) {
        return num.toFixed(4);
    } else {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
}

/**
 * Format large numbers with K, M, B suffix
 */
export function formatCompact(value: number): string {
    if (Math.abs(value) >= 1e9) {
        return (value / 1e9).toFixed(2) + 'B';
    } else if (Math.abs(value) >= 1e6) {
        return (value / 1e6).toFixed(2) + 'M';
    } else if (Math.abs(value) >= 1e3) {
        return (value / 1e3).toFixed(2) + 'K';
    }
    return value.toFixed(2);
}

/**
 * Format PnL with color class suggestion
 */
export function formatPnL(value: number | undefined | null): { text: string; colorClass: string } {
    if (value === undefined || value === null) {
        return { text: '-', colorClass: 'text-gray-500' };
    }

    const prefix = value >= 0 ? '+$' : '-$';
    const text = prefix + formatPrice(Math.abs(value));

    if (value > 0) {
        return { text, colorClass: 'text-green-400' };
    } else if (value < 0) {
        return { text, colorClass: 'text-red-400' };
    }
    return { text: '$0.00', colorClass: 'text-gray-500' };
}
