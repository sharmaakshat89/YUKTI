// backend/src/modules/backtesting/engine/backtest.engine.js

import { getUnifiedSignal } from '../../trading/services/quant.service.js'
// ✅ FIX 1: Correct import path — trading/ mein hai, signal/ mein nahi

// ─────────────────────────────────────────────────────────────────
// CONSTANTS — magic numbers code mein scattered nahi honge
// Ek jagah change karo — poora engine update ho jaata hai
// ─────────────────────────────────────────────────────────────────
const INITIAL_BALANCE    = 10000   // Starting virtual capital
const WARMUP_PERIOD      = 100     // quant.service needs 100 candles for SMA50
const RISK_PER_TRADE_PCT = 0.01    // 1% of balance risk per trade
// ✅ FIX 5: Position sizing — ab balance meaningful hoga
// 1% rule: agar 10000 hai toh max 100 risk per trade
// professional risk management standard hai ye

// ─────────────────────────────────────────────────────────────────
// HELPER: MAX DRAWDOWN CALCULATOR
// Peak se maximum neeche aane ki distance
// Formula: (peak - trough) / peak × 100 = percentage drawdown
// ─────────────────────────────────────────────────────────────────
const calculateMaxDrawdown = (equityCurve) => {
    // ✅ Guard: agar equityCurve empty ya single point ho
    if (!equityCurve || equityCurve.length < 2) return 0

    let peak       = equityCurve[0].balance
    let maxDrawdown = 0

    for (const point of equityCurve) {
        // forEach se for...of kyun?
        // for...of early break support karta hai
        // forEach mein break/continue nahi hota
        // Performance: same O(n) — but cleaner control flow
        if (point.balance > peak) {
            peak = point.balance
        }

        const drawdown = (peak - point.balance) / peak
        // ✅ Percentage mein — absolute nahi
        // Agar peak 15000 tha aur 12000 pe aaya
        // absolute = 3000 (meaningless)
        // percentage = 20% drawdown (meaningful)

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown
        }
    }

    return parseFloat((maxDrawdown * 100).toFixed(2))
    // Return as percentage — e.g. 12.34 means 12.34% drawdown
}

// ─────────────────────────────────────────────────────────────────
// HELPER: COMPILE FINAL RESULTS
// Raw trades array → meaningful statistics
// ─────────────────────────────────────────────────────────────────
const compileResults = (trades, equityCurve, finalBalance) => {
    if (trades.length === 0) {
        return {
            success: false,
            error: 'No trades were generated — signal thresholds too strict for this period'
            // Descriptive error — frontend pe seedha dikhao
        }
    }

    const winningTrades = trades.filter(t => t.result === 'WIN')
    const losingTrades  = trades.filter(t => t.result === 'LOSS')

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const totalLoss   = losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0)
    // ✅ .pnl use karo — .profit nahi (naming consistent rakho)
    // Math.abs() isliye — loss trades mein pnl negative stored hai

    const netPnL       = finalBalance - INITIAL_BALANCE
    const netPnLPct    = ((netPnL / INITIAL_BALANCE) * 100)
    const maxDrawdown  = calculateMaxDrawdown(equityCurve)
    // ✅ FIX 2: ab calculateMaxDrawdown() actually call ho raha hai

    const riskRewardRatio = totalLoss > 0
        ? parseFloat((totalProfit / totalLoss).toFixed(2))
        : null
    // null kyun nahi Infinity?
    // Agar koi loss nahi — RR ratio meaningless hai mathematically
    // Frontend null check karke "Perfect" dikhaye

    return {
        success: true,
        summary: {
            totalTrades:      trades.length,
            winningTrades:    winningTrades.length,
            losingTrades:     losingTrades.length,
            winRate:          parseFloat(((winningTrades.length / trades.length) * 100).toFixed(2)),
            netPnL:           parseFloat(netPnL.toFixed(2)),
            netPnLPercent:    parseFloat(netPnLPct.toFixed(2)),
            totalProfit:      parseFloat(totalProfit.toFixed(2)),
            totalLoss:        parseFloat(totalLoss.toFixed(2)),
            maxDrawdown,                                           // already parsed inside fn
            finalBalance:     parseFloat(finalBalance.toFixed(2)),
            riskRewardRatio,
            profitFactor:     totalLoss > 0
                                ? parseFloat((totalProfit / totalLoss).toFixed(2))
                                : null
            // profitFactor > 1.5 = good strategy
            // profitFactor > 2.0 = excellent strategy
            // Same as RR here, but industry standard naming
        },
        trades,
        equityCurve
    }
}

// ─────────────────────────────────────────────────────────────────
// TRADE EXIT HANDLER — DRY principle
// BUY aur SELL dono ke liye exit logic repeat ho raha tha
// Ek function mein extract karo
// ─────────────────────────────────────────────────────────────────
const closeTrade = (openTrade, exitPrice, result, exitIndex, balance) => {
    // ✅ DRY: Don't Repeat Yourself
    // Pehle BUY WIN, BUY LOSS, SELL WIN, SELL LOSS — 4 blocks
    // Ab sirf ek function — type + result se kaam chala lo

    const priceDiff = openTrade.type === 'BUY'
        ? exitPrice - openTrade.entryPrice      // BUY: exit > entry = profit
        : openTrade.entryPrice - exitPrice      // SELL: entry > exit = profit

    // ─────────────────────────────────────────────
    // POSITION SIZING — 1% Risk Rule
    // Kitna position liya tha? Risk amount / stop distance
    // Example
}