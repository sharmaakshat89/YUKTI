// backend/src/modules/backtesting/engine/backtest.engine.js

import { getUnifiedSignal } from '../../trading/services/quant.service.js'

const INITIAL_BALANCE    = 10000
const WARMUP_PERIOD      = 100
const RISK_PER_TRADE_PCT = 0.01

// ─────────────────────────────────────────────────────────────────
// MAX DRAWDOWN CALCULATOR
// ─────────────────────────────────────────────────────────────────
const calculateMaxDrawdown = (equityCurve) => {
    if (!equityCurve || equityCurve.length < 2) return 0

    let peak        = equityCurve[0].balance
    let maxDrawdown = 0

    for (const point of equityCurve) {
        if (point.balance > peak) peak = point.balance
        const drawdown = (peak - point.balance) / peak
        if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    return parseFloat((maxDrawdown * 100).toFixed(2))
}

// ─────────────────────────────────────────────────────────────────
// COMPILE FINAL RESULTS
// ─────────────────────────────────────────────────────────────────
const compileResults = (trades, equityCurve, finalBalance) => {
    if (trades.length === 0) {
        return {
            success: false,
            error: 'No trades generated — signal thresholds too strict for this period'
        }
    }

    const winningTrades = trades.filter(t => t.result === 'WIN')
    const losingTrades  = trades.filter(t => t.result === 'LOSS')

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const totalLoss   = losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl), 0)

    const netPnL    = finalBalance - INITIAL_BALANCE
    const netPnLPct = (netPnL / INITIAL_BALANCE) * 100

    return {
        success: true,
        summary: {
            totalTrades:   trades.length,
            winningTrades: winningTrades.length,
            losingTrades:  losingTrades.length,
            winRate:       parseFloat(((winningTrades.length / trades.length) * 100).toFixed(2)),
            netPnL:        parseFloat(netPnL.toFixed(2)),
            netPnLPercent: parseFloat(netPnLPct.toFixed(2)),
            totalProfit:   parseFloat(totalProfit.toFixed(2)),
            totalLoss:     parseFloat(totalLoss.toFixed(2)),
            maxDrawdown:   calculateMaxDrawdown(equityCurve),
            finalBalance:  parseFloat(finalBalance.toFixed(2)),
            riskRewardRatio: totalLoss > 0
                ? parseFloat((totalProfit / totalLoss).toFixed(2))
                : null,
            profitFactor: totalLoss > 0
                ? parseFloat((totalProfit / totalLoss).toFixed(2))
                : null
        },
        trades,
        equityCurve
    }
}

// ─────────────────────────────────────────────────────────────────
// TRADE CLOSE HANDLER — DRY
// ─────────────────────────────────────────────────────────────────
const closeTrade = (openTrade, exitPrice, result, exitIndex, balance) => {

    const priceDiff = openTrade.type === 'BUY'
        ? exitPrice - openTrade.entryPrice
        : openTrade.entryPrice - exitPrice
    // BUY:  profit jab price upar jaye — exit > entry
    // SELL: profit jab price neeche jaye — entry > exit

    const riskAmount   = balance * RISK_PER_TRADE_PCT
    // 1% of current balance = max risk on this trade

    const stopDistance = Math.abs(openTrade.entryPrice - openTrade.stopLoss)
    // Kitne pips ka stop hai — position size calculate karne ke liye

    const positionSize = stopDistance > 0
        ? riskAmount / stopDistance
        : 0
    // stopDistance 0 hone pe guard — division by zero prevent

    const pnl = priceDiff * positionSize
    // Actual rupee P&L — raw pips nahi

    const newBalance = result === 'WIN'
        ? balance + Math.abs(pnl)
        : balance - Math.abs(pnl)
    // Math.abs() dono cases mein — negative pnl se balance corrupt na ho

    const tradeRecord = {
        type:         openTrade.type,
        result,
        entryPrice:   parseFloat(openTrade.entryPrice.toFixed(4)),
        exitPrice:    parseFloat(exitPrice.toFixed(4)),
        stopLoss:     parseFloat(openTrade.stopLoss.toFixed(4)),
        takeProfit:   parseFloat(openTrade.takeProfit.toFixed(4)),
        positionSize: parseFloat(positionSize.toFixed(2)),
        riskAmount:   parseFloat(riskAmount.toFixed(2)),
        pnl:          parseFloat(pnl.toFixed(2)),
        entryIndex:   openTrade.entryIndex,
        exitIndex
    }

    return { tradeRecord, newBalance }
}

// ─────────────────────────────────────────────────────────────────
// MAIN ENGINE
// ─────────────────────────────────────────────────────────────────
export const runBacktest = (symbol, interval, candles) => {

    // Input guard
    if (!candles || candles.length < WARMUP_PERIOD + 1) {
        return {
            success: false,
            error: `Need ${WARMUP_PERIOD + 1}+ candles, got ${candles?.length ?? 0}`
        }
    }

    let balance   = INITIAL_BALANCE
    let openTrade = null
    const trades      = []
    const equityCurve = [{ index: 0, balance: INITIAL_BALANCE }]

    for (let i = WARMUP_PERIOD; i < candles.length; i++) {
        const { high, low, close } = candles[i]

        // ─────────────────────────────────────────
        // STEP 1: MANAGE OPEN TRADE
        // Pehle existing trade check karo — phir naya signal
        // ─────────────────────────────────────────
        if (openTrade) {

            if (openTrade.type === 'BUY') {

                if (high >= openTrade.takeProfit) {
                    // TP hit — WIN
                    const { tradeRecord, newBalance } = closeTrade(
                        openTrade, openTrade.takeProfit, 'WIN', i, balance
                    )
                    balance = newBalance
                    trades.push(tradeRecord)
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })

                } else if (low <= openTrade.stopLoss) {
                    // SL hit — LOSS
                    const { tradeRecord, newBalance } = closeTrade(
                        openTrade, openTrade.stopLoss, 'LOSS', i, balance
                    )
                    balance = newBalance
                    trades.push(tradeRecord)
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })
                }

            } else if (openTrade.type === 'SELL') {

                if (low <= openTrade.takeProfit) {
                    // TP hit — WIN (SELL mein price neeche jaata hai)
                    const { tradeRecord, newBalance } = closeTrade(
                        openTrade, openTrade.takeProfit, 'WIN', i, balance
                    )
                    balance = newBalance
                    trades.push(tradeRecord)
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })

                } else if (high >= openTrade.stopLoss) {
                    // SL hit — LOSS
                    const { tradeRecord, newBalance } = closeTrade(
                        openTrade, openTrade.stopLoss, 'LOSS', i, balance
                    )
                    balance = newBalance
                    trades.push(tradeRecord)
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })
                }
            }
        }

        // ─────────────────────────────────────────
        // STEP 2: NEW SIGNAL — sirf jab koi open trade nahi
        // ─────────────────────────────────────────
        if (!openTrade) {

            // Balance blown guard — 80% loss pe stop
            if (balance < INITIAL_BALANCE * 0.20) {
                console.warn(`[BacktestEngine] Balance blown: ${balance.toFixed(2)} — stopping`)
                break
            }

            // Slice sirf tab jab signal check karna ho — not every candle
            const historicalSlice = candles.slice(0, i + 1)
            const signalResult    = getUnifiedSignal(symbol, interval, historicalSlice)

            if (signalResult.success && signalResult.signal !== 'NO_TRADE') {
                openTrade = {
                    type:       signalResult.signal,
                    entryPrice: close,
                    stopLoss:   signalResult.risk.stopLoss,
                    takeProfit: signalResult.risk.takeProfit,
                    entryIndex: i
                }
            }
        }
    }

    // ─────────────────────────────────────────
    // FORCE CLOSE — period end pe open trade hai
    // Last candle ke close pe MTM close karo
    // ─────────────────────────────────────────
    if (openTrade) {
        const lastCandle  = candles[candles.length - 1]
        const lastClose   = lastCandle.close
        const forceResult = openTrade.type === 'BUY'
            ? (lastClose >= openTrade.entryPrice ? 'WIN' : 'LOSS')
            : (lastClose <= openTrade.entryPrice ? 'WIN' : 'LOSS')

        const { tradeRecord, newBalance } = closeTrade(
            openTrade, lastClose, forceResult, candles.length - 1, balance
        )
        balance = newBalance
        trades.push({ ...tradeRecord, forceClose: true })
        equityCurve.push({
            index:   candles.length - 1,
            balance: parseFloat(balance.toFixed(2))
        })
    }

    return compileResults(trades, equityCurve, balance)
}


// ---

// **Updated bug list — BUG 7 revised:**
// ```
// ❌ WRONG (jo maine pehle kaha):
//    src/modules/auth/routes/auth.routes.js ← correct wali
//    (ye file exist hi nahi karti)

// ✅ SAHI:
//    src/routes/auth.routes.js ← correct location
//    Problem: is file ke IMPORTS galat hain

//    from './middleware/auth.validator.js'  → from '../modules/auth/middleware/auth.validator.js'
//    from './auth.controller.js'            → from '../modules/auth/auth.controller.js'