/**
 * tradeCalculations.ts - Core Financial Calculation Functions
 * 🔥 QUANT STANDARD: Strict formulas for Position Sizing & Risk Management
 */

// ============================================
// Types
// ============================================
export interface TPLevel {
    id: string;
    price: number;
    percent: number; // Weight %
}

export interface SLLevel {
    id: string;
    price: number;
    percent: number; // Weight %
}

export interface TradeInputs {
    portfolio: number;
    entryPrice: number;
    riskPercent: number;
    leverage: number;
    side: 'LONG' | 'SHORT';
    tpLevels: TPLevel[];
    slLevels: SLLevel[];
    feePercent: number; // Per side (e.g., 0.05)
}

export interface TradeMetrics {
    // Core Calculations
    riskAmount: number;
    weightedSLDistance: number;
    weightedTPDistance: number;
    calculatedPositionSize: number;
    requiredMargin: number;
    quantity: number;

    // P&L
    grossWin: number;
    grossLoss: number;
    totalFee: number;
    netMaxWin: number;
    netMaxLoss: number;
    riskRewardRatio: number;

    // Validation
    isValid: boolean;
    marginExceedsPortfolio: boolean;
    errorMessage: string;
}

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate Weighted Average Distance (for Multi-TP/SL)
 * Formula: Σ(Distance_% × Weight_%)
 */
export function calculateWeightedDistance(
    levels: (TPLevel | SLLevel)[],
    entryPrice: number,
    side: 'LONG' | 'SHORT',
    isTP: boolean
): number {
    if (!entryPrice || entryPrice <= 0 || levels.length === 0) return 0;

    let totalWeightedDistance = 0;
    let totalWeight = 0;

    for (const level of levels) {
        if (!level.price || level.price <= 0 || !level.percent) continue;

        // Calculate distance %
        let distance = 0;
        if (side === 'LONG') {
            distance = isTP
                ? ((level.price - entryPrice) / entryPrice) * 100
                : ((entryPrice - level.price) / entryPrice) * 100;
        } else {
            distance = isTP
                ? ((entryPrice - level.price) / entryPrice) * 100
                : ((level.price - entryPrice) / entryPrice) * 100;
        }

        // Only count positive distances
        if (distance > 0) {
            totalWeightedDistance += distance * (level.percent / 100);
            totalWeight += level.percent;
        }
    }

    // Return weighted average (normalized to total weight)
    return totalWeight > 0 ? totalWeightedDistance : 0;
}

/**
 * MAIN CALCULATION FUNCTION
 * Implements strict Quant formulas for Position Sizing
 */
export function calculateTradeMetrics(inputs: TradeInputs): TradeMetrics {
    const { portfolio, entryPrice, riskPercent, leverage, side, tpLevels, slLevels, feePercent } = inputs;

    // Default invalid result
    const invalidResult: TradeMetrics = {
        riskAmount: 0,
        weightedSLDistance: 0,
        weightedTPDistance: 0,
        calculatedPositionSize: 0,
        requiredMargin: 0,
        quantity: 0,
        grossWin: 0,
        grossLoss: 0,
        totalFee: 0,
        netMaxWin: 0,
        netMaxLoss: 0,
        riskRewardRatio: 0,
        isValid: false,
        marginExceedsPortfolio: false,
        errorMessage: '',
    };

    // Validation
    if (portfolio <= 0 || entryPrice <= 0) {
        return { ...invalidResult, errorMessage: 'กรุณากรอก Portfolio และ Entry Price' };
    }

    // ============================================
    // Step A: Calculate Risk Amount ($)
    // ============================================
    const riskAmount = portfolio * (riskPercent / 100);

    // ============================================
    // Step B: Calculate Weighted SL/TP Distances
    // ============================================
    const weightedSLDistance = calculateWeightedDistance(slLevels, entryPrice, side, false);
    const weightedTPDistance = calculateWeightedDistance(tpLevels, entryPrice, side, true);

    if (weightedSLDistance <= 0) {
        return { ...invalidResult, riskAmount, errorMessage: 'กรุณาตั้ง Stop Loss ที่ถูกต้อง' };
    }

    // ============================================
    // Step C: Calculate Dynamic Position Size
    // Formula: Position = Risk ÷ (Avg_SL% + Roundtrip_Fee%)
    // ============================================
    const avgSLDecimal = weightedSLDistance / 100;
    const roundtripFee = (feePercent * 2) / 100; // Both entry + exit

    // Position Size that results in exactly RiskAmount loss when SL hit
    const calculatedPositionSize = riskAmount / (avgSLDecimal + roundtripFee);

    // ============================================
    // Step D: Calculate Required Margin
    // Formula: Margin = Position ÷ Leverage
    // ============================================
    const requiredMargin = calculatedPositionSize / leverage;
    const quantity = calculatedPositionSize / entryPrice;

    // ============================================
    // Step E: Validation - Margin must not exceed Portfolio
    // ============================================
    const marginExceedsPortfolio = requiredMargin > portfolio;

    // If margin exceeds, cap position size
    let finalPositionSize = calculatedPositionSize;
    let finalMargin = requiredMargin;

    if (marginExceedsPortfolio) {
        finalMargin = portfolio;
        finalPositionSize = portfolio * leverage;
    }

    // ============================================
    // Step F: Calculate P&L (Gross & Net)
    // ============================================
    const avgTPDecimal = weightedTPDistance / 100;

    const grossWin = finalPositionSize * avgTPDecimal;
    const grossLoss = finalPositionSize * avgSLDecimal;
    const totalFee = finalPositionSize * roundtripFee;

    const netMaxWin = grossWin - totalFee;
    const netMaxLoss = grossLoss + totalFee;

    // ============================================
    // Step G: Calculate Risk:Reward Ratio
    // ============================================
    const riskRewardRatio = netMaxLoss > 0 ? netMaxWin / netMaxLoss : 0;

    return {
        riskAmount,
        weightedSLDistance,
        weightedTPDistance,
        calculatedPositionSize: finalPositionSize,
        requiredMargin: finalMargin,
        quantity: finalPositionSize / entryPrice,
        grossWin,
        grossLoss,
        totalFee,
        netMaxWin,
        netMaxLoss,
        riskRewardRatio,
        isValid: !marginExceedsPortfolio && weightedSLDistance > 0 && weightedTPDistance > 0,
        marginExceedsPortfolio,
        errorMessage: marginExceedsPortfolio
            ? `⚠️ Margin ($${finalMargin.toFixed(2)}) เกิน Portfolio! ลด Leverage หรือ Risk%`
            : '',
    };
}

/**
 * Format R:R ratio for display
 */
export function formatRR(ratio: number): string {
    if (ratio <= 0) return '0:0';
    return `1:${ratio.toFixed(2)}`;
}
