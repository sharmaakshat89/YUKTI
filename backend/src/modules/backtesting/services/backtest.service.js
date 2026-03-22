// backend/src/modules/backtesting/services/backtest.service.js

import NodeCache from 'node-cache';
import { fetchForexData } from '../../market/services/market.service.js';
import { runBacktest } from '../engine/backtest.engine.js';

const backtestCache = new NodeCache({ stdTTL: 3600 });
const MIN_CANDLES_REQUIRED = 120 
export const runBacktestService = async (symbol, interval) => {
    try {
        const ALLOWED_SYMBOLS = ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR'];
        const ALLOWED_INTERVALS = ['1h', '4h', '1day'];

        if (!ALLOWED_SYMBOLS.includes(symbol)) {
            const error = new Error(`Invalid symbol: ${symbol}. Allowed: ${ALLOWED_SYMBOLS.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        if (!ALLOWED_INTERVALS.includes(interval)) {
            const error = new Error(`Invalid interval: ${interval}. Allowed: ${ALLOWED_INTERVALS.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        const cacheKey = `backtest_${symbol}_${interval}`;
        const cached = backtestCache.get(cacheKey);

        if (cached) {
            console.log(`[BacktestService] Cache HIT — ${cacheKey}`);
            return { success: true, data: cached, source: 'cache' };
        }

        console.log(`[BacktestService] Cache MISS — fetching: ${cacheKey}`);

        const marketResult = await fetchForexData(symbol, interval, 500);

        if (!marketResult.success || !marketResult.data) {
            const error = new Error('Failed to fetch market data for backtesting');
            error.statusCode = 502;
            throw error;
        }

        const candles = marketResult.data;
        console.log(`[BacktestService] ${candles.length} candles fetched for ${symbol} ${interval}`);

        const MIN_CANDLES_REQUIRED = 120;
        if (candles.length < MIN_CANDLES_REQUIRED) {
            const error = new Error(
                `Insufficient data: got ${candles.length}, need ${MIN_CANDLES_REQUIRED}+`
            );
            error.statusCode = 422;
            throw error;
        }

        const backtestResult = runBacktest(symbol, interval, candles);

        if (!backtestResult.success) {
            const error = new Error(backtestResult.error || 'Backtest engine failed');
            error.statusCode = 500;
            throw error;
        }

        const enrichedResult = {
            ...backtestResult,
            symbol,
            interval,
            candlesAnalyzed: candles.length,
            dataFrom: new Date(candles[0].time * 1000).toISOString(),
            dataTo:   new Date(candles[candles.length - 1].time * 1000).toISOString(),
            generatedAt: new Date().toISOString()
        };

        backtestCache.set(cacheKey, enrichedResult);
        console.log(`[BacktestService] Cached: ${cacheKey}`);

        return { success: true, data: enrichedResult, source: 'api' };

    } catch (error) {
        console.error(`[BacktestService] ERROR: ${error.message}`, {
            symbol, interval, statusCode: error.statusCode
        });
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

export const invalidateBacktestCache = (symbol, interval) => {
    const key = `backtest_${symbol}_${interval}`;
    backtestCache.del(key);
    console.log(`[BacktestService] Cache invalidated: ${key}`);
};