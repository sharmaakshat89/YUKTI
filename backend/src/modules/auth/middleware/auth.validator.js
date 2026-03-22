// backend/src/modules/auth/middleware/auth.validator.js

import { body, validationResult } from 'express-validator'

// ─────────────────────────────────────────────────────────────────
// REGISTER VALIDATION RULES
// ─────────────────────────────────────────────────────────────────
export const registerValidationRules = [
    body('email')
        .isEmail()
        .withMessage('Valid email required')
        .normalizeEmail(),
        // normalizeEmail() — "User@Gmail.com" → "user@gmail.com"
        // Automatically lowercase + trim karta hai

    body('password')
        // ✅ BUG FIX: pehle 'passsword' tha (3 s) — typo
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .trim()
]

// ─────────────────────────────────────────────────────────────────
// LOGIN VALIDATION RULES
// Register se alag kyun nahi use kiya?
// Login mein password complexity check nahi chahiye
// Sirf presence + basic format check
// ─────────────────────────────────────────────────────────────────
export const loginValidationRules = [
    body('email')
        .isEmail()
        .withMessage('Valid email required')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password required')
        .trim()
        // notEmpty() — sirf check karo khali nahi hai
        // length check nahi — wrong password pe
        // meaningful error chahiye, not "too short"
]

// ─────────────────────────────────────────────────────────────────
// VALIDATE MIDDLEWARE — same as before
// ─────────────────────────────────────────────────────────────────
export const validate = (req, res, next) => {
    const errors = validationResult(req)

    if (errors.isEmpty()) return next()

    const extractedErrors = errors.array().map(err => ({
        [err.path]: err.msg
    }))

    return res.status(422).json({
        success: false,
        errors:  extractedErrors
    })
}