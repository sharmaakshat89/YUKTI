// backend/src/modules/backtesting/routes/backtest.routes.js

import express        from 'express'
import rateLimit      from 'express-rate-limit'
import { protect }    from '../../auth/middleware/auth.middleware.js'
import { runBacktestController } from '../controllers/backtest.controller.js'

const router = express.Router()

// ─────────────────────────────────────────────────────────────────
// RATE LIMITER — TIER 1 (IP based)
// Kyun IP based?
// JWT token ke bina bhi throttle karo
// Agar koi token rotate karta rahe — IP se pakad lo
//
// windowMs: 60 min window
// max: 5 requests per window per IP
//
// Kyun sirf 5?
// Backtest = Twelve Data API call = credit cost
// Free plan = 800 credits/day
// 10 users × 5 requests = 50 API calls max
// Cache hit pe API nahi lagta — real usage aur bhi kam
// ─────────────────────────────────────────────────────────────────
const ipRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    // 60 min × 60 sec × 1000 ms = 3,600,000 ms = 1 hour
    // Number mein likhne se better — human readable

    max: 5,
    // Per IP per window — 5 requests

    standardHeaders: true,
    // Response mein RateLimit headers add karo:
    // RateLimit-Limit: 5
    // RateLimit-Remaining: 3
    // RateLimit-Reset: 1711234567
    // Frontend in headers padh ke countdown timer dikha sakta hai

    legacyHeaders: false,
    // Purane X-RateLimit-* headers disable karo
    // standardHeaders: true ke saath redundant hain

    message: {
        success: false,
        error: 'Too many backtest requests from this IP — please wait 1 hour',
        retryAfter: '1 hour'
    },
    // message object kyun nahi string?
    // Hamara poora API consistent JSON return karta hai
    // String return karne se frontend ka error handler break kar sakta hai

    skip: (req) => {
        // Development mein rate limit skip karo
        // Local testing mein baar baar 429 nahi chahiye
        return process.env.NODE_ENV === 'development'
        // true return = request skip (no limiting)
        // false return = limiting apply hoga
    }
})

// ─────────────────────────────────────────────────────────────────
// RATE LIMITER — TIER 2 (User based)
// IP limiter ke baad bhi — logged in user pe alag limit
//
// Kyun dono chahiye?
// Scenario: office ka shared IP — 10 log ek hi IP se
//           IP limiter 5 requests mein sab block
// Solution: IP limiter = broad protection (unauthenticated)
//           User limiter = granular protection (authenticated)
//
// keyGenerator: req.user.id se key banao
// protect middleware ne req.user attach kiya hoga
// ─────────────────────────────────────────────────────────────────
const userRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    // Same window — 1 hour

    max: 3,
    // User per window — sirf 3
    // IP se kam kyun?
    // Authenticated user = accountable
    // Agar abuse kare — seedha user ID track hoga
    // Strict limit = less API credit waste

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        // req.user — protect middleware ne JWT decode karke attach kiya
        // req.user._id = MongoDB ObjectId (string form)
        return req.user?._id?.toString() ?? req.ip
        // Fallback req.ip kyun?
        // Agar protect middleware ne user attach nahi kiya
        // (edge case — token expire hone ke baad)
        // toh IP pe fallback karo — crash nahi
    },

    message: {
        success: false,
        error: 'Backtest limit reached for your account — 3 per hour allowed',
        retryAfter: '1 hour'
    },

    skip: (req) => process.env.NODE_ENV === 'development'
    // Arrow function shorthand — same skip logic
})

// ─────────────────────────────────────────────────────────────────
// MIDDLEWARE CHAIN — order matters
//
// POST /api/v1/backtest
//      ↓
// ipRateLimiter     ← FIRST: IP check (no auth needed)
//      ↓
// protect           ← SECOND: JWT verify, req.user attach
//      ↓
// userRateLimiter   ← THIRD: User check (req.user available now)
//      ↓
// runBacktestController ← LAST: actual work
//
// Kyun protect ke BAAD userRateLimiter?
// userRateLimiter ko req.user chahiye
// req.user sirf protect ke baad available hota hai
// Agar pehle lagate toh req.user = undefined → IP fallback
// ─────────────────────────────────────────────────────────────────
router.post(
    '/',
    ipRateLimiter,
    protect,
    userRateLimiter,
    runBacktestController
)
// '/' kyun '/backtest' nahi?
// server.js mein register hoga:
// app.use('/api/v1/backtest', backtestRouter)
// Route already '/api/v1/backtest' pe mounted hai
// Isliye yahan sirf '/' — double nesting avoid karo

export default router