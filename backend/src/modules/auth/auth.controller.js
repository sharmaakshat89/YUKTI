// backend/src/modules/auth/auth.controller.js

import { registerUser, loginUser } from './services/auth.services.js'

// ─────────────────────────────────────────────────────────────────
// REGISTER CONTROLLER
// ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { email, password } = req.body

        const userData = await registerUser(email, password)

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data:    userData
        })

    } catch (err) {
        console.error(`[AuthController] Register error: ${err.message}`)
        return res.status(err.statusCode || 500).json({
            success: false,
            error:   err.message || 'Internal server error'
        })
    }
}

// ─────────────────────────────────────────────────────────────────
// LOGIN CONTROLLER
// ─────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // ─────────────────────────────────────────
        // BASIC PRESENCE CHECK
        // Validator middleware bhi check karta hai
        // lekin agar koi route pe validator na lage
        // toh controller bhi guard kare
        // ─────────────────────────────────────────
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error:   'Email aur password dono required hain'
            })
        }

        const userData = await loginUser(email, password)

        // ─────────────────────────────────────────
        // 200 kyun 201 nahi?
        // 201 = resource created (register ke liye)
        // 200 = successful operation (login ke liye)
        // Login mein kuch create nahi hota — sirf verify
        // ─────────────────────────────────────────
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data:    userData
        })

    } catch (err) {
        console.error(`[AuthController] Login error: ${err.message}`)
        return res.status(err.statusCode || 500).json({
            success: false,
            error:   err.message || 'Internal server error'
        })
    }
}