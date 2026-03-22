import { RSI, SMA, ATR, ADX, WMA, BollingerBands, MACD } from 'technicalindicators';
import { SuperTrend } from '@debut/indicators';
import NodeCache from 'node-cache';

const signalCache = new NodeCache({ stdTTL: 60 });

// =============================================================================
// 🧠 WEIGHT TABLE — sum must = 1.0
// =============================================================================
// T_slow  (SMA trend)        → 0.15
// T_fast  (HMA trend)        → 0.15
// ST_bias (SuperTrend dir)   → 0.15
// M_t     (RSI momentum)     → 0.15
// TS_t    (ADX strength)     → 0.10
// VEI_t   (Volatility ratio) → 0.10
// S_t     (Market structure) → 0.15
// MACD_n  (MACD direction)   → 0.05
// TOTAL                      → 1.00 ✅
// =============================================================================
export const getUnifiedSignal = (symbol, interval, candles) => {

    // -------------------------------------------------------------------------
    // 🛡️ INPUT VALIDATION
    // Hinglish: kuch bhi process karne se pehle inputs check karo
    // candles.length < 2 check: S_t ke liye prev candle chahiye
    // candles.length < 100 check: SMA50 stable hone ke liye 100+ chahiye
    // -------------------------------------------------------------------------
    if (!candles || candles.length < 2) {
        return { success: false, error: "No candle data provided" };
    }
    if (candles.length < 100) {
        return { success: false, error: "Insufficient data for warm-up (Need 100+)" };
    }

    // -------------------------------------------------------------------------
    // 🔑 CACHE KEY
    // Hinglish: symbol + interval + last candle ka time = unique key
    // optional chaining (?.) — agar last candle malformed ho toh crash nahi
    // -------------------------------------------------------------------------
    const cacheKey = `sig_${symbol}_${interval}_${candles?.[candles.length - 1]?.time}`;
    const cachedData = signalCache.get(cacheKey);
    if (cachedData) return cachedData;

    try {

        // ---------------------------------------------------------------------
        // 📦 RAW DATA EXTRACTION
        // .map() explanation:
        //   candles = [{ open, high, low, close, time }, ...]
        //   candles.map(c => c.close) → sirf close prices ka naya array
        //   indicators ko alag-alag arrays chahiye, isliye teen baar map kiya
        // ---------------------------------------------------------------------
        const close = candles.map(c => c.close);
        const high  = candles.map(c => c.high);
        const low   = candles.map(c => c.low);

        const P_t = close[close.length - 1];
        // Hinglish: current price = latest candle ka close (ek Number)

        // =====================================================================
        // 📈 SMA 50 — SLOW TREND
        // Hinglish: last 50 candles ka simple average
        // price > MA → uptrend, price < MA → downtrend
        // fallback P_t: T_slow = 0 ho jaayega (neutral)
        // =====================================================================
        const smaArr = SMA.calculate({ period: 50, values: close });
        const MA_t = smaArr.length ? smaArr.at(-1) : P_t;

        // =====================================================================
        // 📈 HMA 9 — FAST TREND
        // Hinglish: Hull Moving Average — fast aur lag-free
        // Normal MA pe delay hota hai, HMA use remove karta hai
        //
        // Formula: HMA = WMA( 2*WMA(n/2) - WMA(n), sqrt(n) )
        //   Step 1: WMA(halfPeriod) — fast WMA
        //   Step 2: WMA(fullPeriod) — slow WMA
        //   Step 3: rawHMA = 2*fast - slow (lag cancel hota hai)
        //   Step 4: WMA(sqrtPeriod) on rawHMA → final smoothing
        //
        // Alignment fix:
        //   wmaHalf aur wmaFull alag lengths ke hote hain
        //   dono right-aligned hain (most recent candle = last index)
        //   offset = length difference → left side skip karo
        //   wmaHalf.slice(-wmaFull.length) → sirf overlapping part rakho
        //   ab dono arrays ek hi time period represent karte hain → safe map()
        // =====================================================================
        const hmaPeriod  = 9;
        const halfPeriod = Math.floor(hmaPeriod / 2);        // = 4
        const sqrtPeriod = Math.floor(Math.sqrt(hmaPeriod)); // = 3

        const wmaHalf = WMA.calculate({ period: halfPeriod, values: close });
        const wmaFull = WMA.calculate({ period: hmaPeriod,  values: close });

        // Align wmaHalf to wmaFull (both right-anchored, trim the left of wmaHalf)
        const alignedHalf = wmaHalf.slice(-wmaFull.length);

        const rawHMA = alignedHalf
            .map((val, i) => 2 * val - wmaFull[i])
            .filter(v => !isNaN(v));

        // Length guard: rawHMA needs at least sqrtPeriod values for final WMA
        const hmaArr = rawHMA.length >= sqrtPeriod
            ? WMA.calculate({ period: sqrtPeriod, values: rawHMA })
            : [];

        const HMA_t = hmaArr.length ? hmaArr.at(-1) : P_t;
        // fallback P_t: T_fast = 0 ho jaayega (neutral)

        // =====================================================================
        // 📉 SUPERTREND — TREND DIRECTION FILTER
        // Hinglish: ek trailing stop line jo trend ke saath move karta hai
        // price > line → bullish (+1), price < line → bearish (-1)
        //
        // forEach explanation:
        //   SuperTrend stateful hai — ek baar mein sab candles feed karni padti hain
        //   har iteration ke baad currentST update hota hai
        //   loop ke end pe currentST = latest candle ka value
        //   property check: agar koi candle malformed ho toh skip (no crash)
        // =====================================================================
        const st = new SuperTrend(10, 3);
        let currentST;

        candles.forEach(candle => {
            if (candle.high && candle.low && candle.close) {
                currentST = st.nextValue(candle.high, candle.low, candle.close);
            }
        });

        const ST_bias = currentST ? Math.sign(P_t - currentST) : 0;
        // Math.sign: +1 (bullish), -1 (bearish), 0 (on the line)

        // =====================================================================
        // 📊 RSI 14 — MOMENTUM
        // Hinglish: buyers vs sellers ka relative strength
        // 50+ = buyers dominant, 50- = sellers dominant
        // fallback 50: M_t = 0 (neutral)
        // =====================================================================
        const rsiArr = RSI.calculate({ period: 14, values: close });
        const RSI_t = rsiArr.length ? rsiArr.at(-1) : 50;

        // =====================================================================
        // 📊 ADX 14 — TREND STRENGTH
        // Hinglish: trend kitna powerful hai (direction nahi batata)
        // < 20 = choppy/sideways, 25+ = clear trend, 50+ = very strong
        // fallback 0: weak trend assume karo
        // =====================================================================
        const adxArr = ADX.calculate({ period: 14, high, low, close });
        const ADX_val = adxArr.length ? adxArr.at(-1).adx : 0;

        // =====================================================================
        // 📊 ATR — VOLATILITY EFFICIENCY INDEX (VEI)
        // Hinglish: market kitna move kar raha hai abhi vs average
        // VEI > 1 = breakout chal raha hai
        // VEI ≈ 1 = normal volatility
        // VEI < 1 = market tight/dead
        //
        // Double guard on ATR_50:
        //   empty array → fallback 1 (prevents crash)
        //   value = 0   → fallback 1 (prevents Infinity from division)
        // =====================================================================
        const atr10Arr = ATR.calculate({ period: 10, high, low, close });
        const atr50Arr = ATR.calculate({ period: 50, high, low, close });

        const ATR_10 = atr10Arr.length ? atr10Arr.at(-1) : 0;
        const ATR_50 = atr50Arr.length ? atr50Arr.at(-1) : 1;

        const VEI_t = ATR_50 ? ATR_10 / ATR_50 : 0;

        // =====================================================================
        // 📊 BOLLINGER BANDS — SQUEEZE DETECTION
        // Hinglish: bands tight hain → market soi hui hai → no trade zone
        // BBWidth < 0.02 = squeeze penalty -0.3 on final score
        // middle default 1: division by zero avoid karo
        // =====================================================================
        const bbArr = BollingerBands.calculate({ period: 20, values: close, stdDev: 2 });
        const bb = bbArr.length ? bbArr.at(-1) : null;

        const BBWidth_t = (bb && bb.middle) ? (bb.upper - bb.lower) / bb.middle : 0;

        // =====================================================================
        // 📊 MACD — MOMENTUM DIRECTION (tiebreaker)
        // Hinglish: do EMAs ka difference → momentum build ho raha hai ya nahi
        // Histogram positive = upside momentum, negative = downside
        // Math.sign() isliye: raw histogram arbitrary units mein hota hai
        // weight sirf 0.05 hai — yeh tiebreaker hai, primary signal nahi
        //
        // ?.histogram || 0 explanation:
        //   .at(-1) undefined ho sakta hai → ?.histogram safely undefined dega
        //   || 0 → undefined/NaN dono ko 0 se replace karo
        // =====================================================================
        const macdArr = MACD.calculate({
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            values: close,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });

        const MACD_hist = macdArr.at(-1)?.histogram || 0;
        const MACD_n = Math.sign(MACD_hist);
        // +1 (bullish momentum), -1 (bearish), 0 (neutral)

        // =====================================================================
        // 📊 MARKET STRUCTURE (S_t)
        // Hinglish: price action ka skeleton
        // Higher High + Higher Low = uptrend (+1)
        // Lower High + Lower Low   = downtrend (-1)
        // kuch aur                 = ranging (0)
        // (candles.length >= 2 already validated above)
        // =====================================================================
        const prev = candles[candles.length - 2];
        const curr = candles[candles.length - 1];

        let S_t = 0;
        if (curr.high > prev.high && curr.low > prev.low)       S_t =  1;
        else if (curr.high < prev.high && curr.low < prev.low)  S_t = -1;

        // =====================================================================
        // 🔄 NORMALIZATION
        // Hinglish: sab indicators alag units mein hain
        // sab ko roughly -1 to +1 scale pe laao taaki weights sahi kaam karein
        //
        // T_slow / T_fast zero guard: MA/HMA kabhi 0 nahi hona chahiye
        // practically, but edge case ke liye guard rakho
        // =====================================================================
        const T_slow = MA_t  ? (P_t - MA_t)  / MA_t  : 0;
        const T_fast = HMA_t ? (P_t - HMA_t) / HMA_t : 0;
        const M_t    = (RSI_t - 50) / 50;   // 50 neutral → 0, 100 → +1, 0 → -1
        const TS_t   = ADX_val / 50;         // 50 = full strength = 1.0

        // =====================================================================
        // 🧠 UNIFIED SCORE (C_t)
        // Hinglish: sab normalized signals ko ek number mein compress karo
        // positive = overall bullish, negative = bearish
        // Weights: 0.15+0.15+0.15+0.15+0.10+0.10+0.15+0.05 = 1.00 ✅
        // =====================================================================
        let C_t =
            (0.15 * T_slow)  +   // SMA50: slow trend direction
            (0.15 * T_fast)  +   // HMA9:  fast trend direction
            (0.15 * ST_bias) +   // SuperTrend: trailing bias
            (0.15 * M_t)     +   // RSI: momentum pressure
            (0.10 * TS_t)    +   // ADX: trend strength
            (0.10 * VEI_t)   +   // ATR ratio: volatility efficiency
            (0.15 * S_t)     +   // Price structure: HH/HL or LL/LH
            (0.05 * MACD_n);     // MACD: momentum tiebreaker

        // Squeeze penalty: market consolidating hai → signal unreliable
        if (BBWidth_t < 0.02) C_t -= 0.3;

        // =====================================================================
        // 🚦 FINAL DECISION
        // Hinglish: C_t score enough nahi — confirmation bhi chahiye
        // ADX > 25: trend actually exist karta hai
        // ST_bias: SuperTrend direction score ke saath agree kar raha hai
        // teeno agree karein tabhi trade lo — false signals drastically kam hote hain
        // =====================================================================
        let signal = "NO_TRADE";

        if      (C_t >  0.7 && ADX_val > 25 && ST_bias ===  1) signal = "BUY";
        else if (C_t < -0.7 && ADX_val > 25 && ST_bias === -1) signal = "SELL";

        // =====================================================================
        // 📦 RESULT OBJECT
        // Return types:
        //   success         → Boolean
        //   symbol          → String
        //   signal          → String: "BUY" | "SELL" | "NO_TRADE"
        //   score           → Number (4 decimal places)
        //   risk.stopLoss   → Number (4 decimal places)
        //   risk.takeProfit → Number (4 decimal places)
        //   indicators      → Object (raw values for UI/logging/backtesting)
        //   timestamp       → Number (Unix ms)
        // =====================================================================
    
    const result = {
    success: true,
    symbol,
    signal,
    score: parseFloat(C_t.toFixed(4)),
    risk: {
        stopLoss:   parseFloat((P_t - ATR_10 * 1.5).toFixed(4)),
        takeProfit: parseFloat((P_t + ATR_10 * 3).toFixed(4))
    },

    indicators: {
        rsi:        parseFloat(RSI_t.toFixed(2)),
        // RSI_t = last RSI value — current candle ka
        adx:        parseFloat(ADX_val.toFixed(2)),
        // ADX_val = last ADX value
        supertrend: ST_bias,
        // +1 ya -1 ya 0
        hma:        parseFloat(HMA_t.toFixed(4)),
        // HMA_t = last HMA value
        macdHist:   parseFloat(MACD_hist.toFixed(4)),
        // MACD histogram last value
        bbWidth:    parseFloat(BBWidth_t.toFixed(4)),
        // Bollinger Band width last value
        ma50:       parseFloat(MA_t.toFixed(4))
        // MA_t already calculate hua tha upar
        // sirf return mein nahi tha — ab add kiya
    },

    indicatorSeries: {
        ma50: smaArr.map(v => parseFloat(v.toFixed(4))),
        // smaArr = SMA.calculate() ne return kiya tha poora array
        // [83.20, 83.31, 83.38, 83.45, ...]
        // har candle ka MA50 value — chart pe line banegi
        // .map() se har value 4 decimal pe round ki

        rsi: rsiArr.map(v => parseFloat(v.toFixed(2))),
        // rsiArr = RSI.calculate() ne return kiya tha
        // [45.2, 43.1, 38.4, 34.2, ...]
        // neeche wala RSI panel is array se banega

        macd: macdArr.map(v => parseFloat((v.histogram || 0).toFixed(4))),
        // macdArr = MACD.calculate() ne return kiya tha
        // har element mein histogram, signal, MACD hota hai
        // histogram nikala — MACD panel ke liye
        // || 0 — agar kisi candle mein undefined ho

        adx: adxArr.map(v => parseFloat((v.adx || 0).toFixed(2))),
        // adxArr = ADX.calculate() ne return kiya tha
        // har element mein .adx property hoti hai
        // ADX panel ke liye

        hma: hmaArr.map(v => parseFloat(v.toFixed(4))),
        // hmaArr = WMA.calculate() ne return kiya tha
        // HMA line chart pe overlay hogi candles ke saath

        bbUpper: bbArr.map(v => parseFloat((v.upper || 0).toFixed(4))),
        // bbArr = BollingerBands.calculate() ne return kiya tha
        // upper band — chart pe upper line
        
        bbLower: bbArr.map(v => parseFloat((v.lower || 0).toFixed(4))),
        // lower band — chart pe lower line
        // dono bands ke beech mein price hoti hai mostly
    },

    timestamp: Date.now()
};


        signalCache.set(cacheKey, result);
        return result;

    } catch (err) {
        console.error("YUKTI_FATAL_ERROR:", err.stack);
        return { success: false, error: "Engine failure" };
    }
};