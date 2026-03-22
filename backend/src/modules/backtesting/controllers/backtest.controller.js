// backend/src/modules/backtesting/controllers/backtest.controller.js

import { runBacktestService } from '../services/backtest.service.js'

// ─────────────────────────────────────────────────────────────────
// ALLOWED VALUES — controller level pe bhi define karo
// Service mein bhi hai — double validation = defense in depth
// Agar service import fail ho — controller still rejects bad input
// ─────────────────────────────────────────────────────────────────
const ALLOWED_SYMBOLS   = ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR']
const ALLOWED_INTERVALS = ['1h', '4h', '1day']

// ─────────────────────────────────────────────────────────────────
// POST /api/v1/backtest
// Body: { symbol: 'USD/INR', interval: '1h' }
// ─────────────────────────────────────────────────────────────────
export const runBacktestController = async (req, res) => {
    try {
        // ─────────────────────────────────────────
        // STEP 1: EXTRACT FROM BODY
        // Destructure karo — req.body.symbol baar baar nahi likhna
        // ─────────────────────────────────────────
        const { symbol, interval } = req.body
        // req.body = parsed JSON — express.json() middleware
        // ne already kar diya server.js mein

        // ─────────────────────────────────────────
        // STEP 2: PRESENCE CHECK
        // .trim() kyun? User ne " USD/INR " bheja toh?
        // trim ke baad validation sahi kaam karega
        // ─────────────────────────────────────────
        const cleanSymbol   = symbol?.trim().toUpperCase()
        const cleanInterval = interval?.trim().toLowerCase()
        // ?. optional chaining — agar symbol undefined ho
        // toh .trim() crash nahi karega
        // undefined?.trim() = undefined (safe)
        // undefined.trim()  = TypeError (crash)

        if (!cleanSymbol || !cleanInterval) {
            return res.status(400).json({
                success: false,
                error: 'symbol aur interval dono required hain',
                example: { symbol: 'USD/INR', interval: '1h' }
                // example field kyun?
                // Developer experience — frontend developer ko
                // Postman ya docs mein dhundna nahi padega
            })
        }

        // ─────────────────────────────────────────
        // STEP 3: WHITELIST VALIDATION
        // indexOf nahi — includes() zyada readable hai
        // ─────────────────────────────────────────
        if (!ALLOWED_SYMBOLS.includes(cleanSymbol)) {
            return res.status(400).json({
                success: false,
                error: `Invalid symbol: "${cleanSymbol}"`,
                allowedSymbols: ALLOWED_SYMBOLS
                // allowedSymbols return karo — frontend dropdown
                // automatically populate kar sakta hai
            })
        }

        if (!ALLOWED_INTERVALS.includes(cleanInterval)) {
            return res.status(400).json({
                success: false,
                error: `Invalid interval: "${cleanInterval}"`,
                allowedIntervals: ALLOWED_INTERVALS
            })
        }

        // ─────────────────────────────────────────
        // STEP 4: LOG THE REQUEST
        // Production mein har backtest request log karo
        // Kyun? Rate limit abuse track karna, debugging,
        // aur analytics ke liye
        // req.user?.email — protect middleware ne attach kiya
        // ─────────────────────────────────────────
        console.log(`[BacktestController] Request — symbol: ${cleanSymbol}, interval: ${cleanInterval}, user: ${req.user?.email ?? 'unknown'}`)

        // ─────────────────────────────────────────
        // STEP 5: SERVICE CALL
        // Heavy lifting service karta hai
        // Controller sirf await karta hai aur response deta hai
        // ─────────────────────────────────────────
        const result = await runBacktestService(cleanSymbol, cleanInterval)

        // ─────────────────────────────────────────
        // STEP 6: SUCCESS RESPONSE
        // 200 kyun nahi 201?
        // 201 = resource created (POST jo DB mein save kare)
        // 200 = successful computation — kuch DB mein nahi gaya
        // ─────────────────────────────────────────
        return res.status(200).json({
            success: true,
            source:  result.source,   // 'cache' ya 'api' — frontend debug ke liye
            data:    result.data
        })

    } catch (err) {
        // ─────────────────────────────────────────
        // STEP 7: ERROR HANDLING
        // Service ya engine ne throw kiya — yahan pakdo
        // err.statusCode — custom property jo service ne set kiya
        // 400 = bad input, 422 = insufficient data,
        // 502 = upstream API fail, 500 = unknown
        // ─────────────────────────────────────────
        console.error(`[BacktestController] ERROR — ${err.message}`, {
            statusCode: err.statusCode,
            stack:      process.env.NODE_ENV === 'development' ? err.stack : undefined
            // stack sirf development mein log karo
            // production logs mein stack trace = security risk
            // (internal paths expose hote hain)
        })

        return res.status(err.statusCode || 500).json({
            success: false,
            error:   err.message || 'Backtest failed — please try again'
        })
    }
}