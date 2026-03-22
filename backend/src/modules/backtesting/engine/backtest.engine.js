import { getUnifiedSignal } from '../../signal/services/quant.service.js'

const calculateMaxDrawdown = (equityCurve) => {
    let maxDrawdown = 0
    let peak = equityCurve[0].balance

    equityCurve.forEach(point => {
        if (point.balance > peak) peak = point.balance
        const drawdown = peak - point.balance
        if (drawdown > maxDrawdown) maxDrawdown = drawdown
    })

    return maxDrawdown
}

const compileResults = (trades, equityCurve, finalBalance) => {
    if (trades.length === 0) {
        return { success: false, error: 'No trades were generated in this period' }
    }

    const winningTrades = trades.filter(t => t.result === 'WIN')
    const losingTrades = trades.filter(t => t.result === 'LOSS')
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0)
    const totalLoss = losingTrades.reduce((sum, t) => Math.abs(t.profit) + sum, 0)
    const netPnL = finalBalance - 10000

    return {
        success: true,
        summary: {
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: parseFloat(((winningTrades.length / trades.length) * 100).toFixed(2)),
            netPnL: parseFloat(netPnL.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            totalLoss: parseFloat(totalLoss.toFixed(2)),
            maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
            finalBalance: parseFloat(finalBalance.toFixed(2)),
            riskRewardRatio: losingTrades.length > 0
                ? parseFloat((totalProfit / totalLoss).toFixed(2))
                : null
        },
        trades,
        equityCurve
    }
}

export const runBacktest = (symbol, candles) => {//backtest engine will first get symbol and the no of candles(ohlc)
    const WARMUP_PERIOD = 100
    const trades = []//completed trades
    let openTrade = null //info of current open trade
    let balance = 10000
    const equityCurve = [{ index: 0, balance: 10000 }]// calculating balance over time as it changes after each trade
    
    for (let i = WARMUP_PERIOD; i < candles.length; i++) {
        const currentCandle = candles[i]
        const historicalCandles = candles.slice(0, i + 1)

        if (openTrade) {//was a trade opened
            const { high, low } = currentCandle

            if (openTrade.type === 'BUY') {
                if (high >= openTrade.takeProfit) {
                    const profit = openTrade.takeProfit - openTrade.entryPrice
                    balance += profit
                    trades.push({ type: 'BUY', entryPrice: openTrade.entryPrice, exitPrice: openTrade.takeProfit, stopLoss: openTrade.stopLoss, takeProfit: openTrade.takeProfit, profit: parseFloat(profit.toFixed(4)), result: 'WIN', entryIndex: openTrade.entryIndex, exitIndex: i })
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })
                } else if (low <= openTrade.stopLoss) {
                    const loss = openTrade.entryPrice - openTrade.stopLoss
                    balance -= loss
                    trades.push({ type: 'BUY', entryPrice: openTrade.entryPrice, exitPrice: openTrade.stopLoss, stopLoss: openTrade.stopLoss, takeProfit: openTrade.takeProfit, profit: parseFloat((-loss).toFixed(4)), result: 'LOSS', entryIndex: openTrade.entryIndex, exitIndex: i })
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })
                }
            } else if (openTrade.type === 'SELL') {
                if (low <= openTrade.takeProfit) {
                    const profit = openTrade.entryPrice - openTrade.takeProfit
                    balance += profit
                    trades.push({ type: 'SELL', entryPrice: openTrade.entryPrice, exitPrice: openTrade.takeProfit, stopLoss: openTrade.stopLoss, takeProfit: openTrade.takeProfit, profit: parseFloat(profit.toFixed(4)), result: 'WIN', entryIndex: openTrade.entryIndex, exitIndex: i })
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })
                } else if (high >= openTrade.stopLoss) {
                    const loss = openTrade.stopLoss - openTrade.entryPrice
                    balance -= loss
                    trades.push({ type: 'SELL', entryPrice: openTrade.entryPrice, exitPrice: openTrade.stopLoss, stopLoss: openTrade.stopLoss, takeProfit: openTrade.takeProfit, profit: parseFloat((-loss).toFixed(4)), result: 'LOSS', entryIndex: openTrade.entryIndex, exitIndex: i })
                    openTrade = null
                    equityCurve.push({ index: i, balance: parseFloat(balance.toFixed(2)) })
                }
            }
        }

        if (!openTrade) {
            const signalResult = getUnifiedSignal(symbol, candles[i].interval || '1h', historicalCandles)
            if (signalResult.success && signalResult.signal !== 'NO_TRADE') {
                openTrade = {
                    type: signalResult.signal,
                    entryPrice: currentCandle.close,
                    stopLoss: signalResult.risk.stopLoss,
                    takeProfit: signalResult.risk.takeProfit,
                    entryIndex: i
                }
            }
        }
    }

    return compileResults(trades, equityCurve, balance)
}







