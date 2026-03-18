import axios from 'axios';
import NodeCache from 'node-cache'; // In-memory cache for signal stability
import dotenv from 'dotenv';

dotenv.config();

// Standard TTL 60 seconds i.e 1 minute tak API call nahi hogi same symbol ke liye
const signalCache = new NodeCache({ stdTTL: 60 }); //reserves space in RAM

/**
 * Service to fetch Forex Data (e.g., EUR/USD) from Twelve Data.
 * Guards credits by using an internal caching layer.
 */
export const fetchForexData = async (symbol = 'EUR/USD', interval = '1h') => {
    const cacheKey = `forex_${symbol}_${interval}`; // Unique key for cache lookup

    // 1. SIGNAL CACHE CHECK (Architecture Rule [1])
    const cachedData = signalCache.get(cacheKey); // RAM mein check kar rahe hain data hai ya nahi
    if (cachedData) { // if found
        console.log("found in cache"); 
        return { success: true, data: cachedData, source: 'cache' }; // API call bacha li
    }

    try {
        // 2. EXTERNAL API CALL
        const response = await axios.get(`https://api.twelvedata.com/time_series`, {
            params: {
                symbol: symbol, // Currency pair like EUR/USD
                interval: interval, // '1h' candle
                apikey: process.env.TWELVE_DATA_KEY, // Obtained from Twelve Data dashboard
                outputsize: 100 // 100 candles for MA50 calculation foundation [3]
            }
        });

        // 3. API ERROR HANDLING 
        if (response.data.status === 'error') { // Twelve Data specific error check
            throw new Error(response.data.message); // Credit exhaustion ya invalid symbol
        }

        // 4. DATA TRANSFORMATION & PARSEFLOAT
        const formattedData = response.data.values.map(candle => ({
            time: new Date(candle.datetime).getTime() / 1000, // String to Unix timestamp for Charts [1]
            open: parseFloat(candle.open), // String to Number conversion for Math
            high: parseFloat(candle.high), // High price for volatility filters [3]
            low: parseFloat(candle.low), // Low price for ATR
            close: parseFloat(candle.close), // Most critical for MA50
            volume: parseFloat(candle.volume) || 0 // Forex volume is often zero or ticks
        })).reverse(); // Reverse because , to calculate indicators we go from old to new [1]

        // 5. UPDATE SIGNAL CACHE
        signalCache.set(cacheKey, formattedData); // Key: symbol_interval, Value: candles

        return { success: true, data: formattedData, source: 'api' };

    } catch (error) {
        console.error(`error msg: ${error.message}`);
        throw error;
    }
};