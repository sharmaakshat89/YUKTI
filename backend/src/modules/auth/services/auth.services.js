// backend/src/modules/auth/services/auth.services.js

import User from '../models/user.model.js'
import jwt  from 'jsonwebtoken'

// ─────────────────────────────────────────────────────────────────
// TOKEN GENERATOR — module scope mein rakho
// Pehle registerUser ke andar tha — galat
// Agar loginUser bhi same function use kare toh?
// DRY principle — ek jagah define karo
// ─────────────────────────────────────────────────────────────────
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    )
    // jwt.sign() — 3 arguments:
    // 1. payload: { id } — token mein encode hoga
    // 2. secret: JWT_SECRET — signing key
    // 3. options: expiresIn — 30 days baad token expire
}

// ─────────────────────────────────────────────────────────────────
// REGISTER USER
// ✅ FIX: limit 10 → 5
// ─────────────────────────────────────────────────────────────────
export const registerUser = async (email, password) => {

    // ─────────────────────────────────────────
    // REGISTRATION LIMIT CHECK
    // ✅ 10 → 5 (requirement change)
    // countDocuments() — full collection scan nahi karta
    // MongoDB internally count maintain karta hai
    // O(1) operation — fast
    // ─────────────────────────────────────────
    const totalUsers = await User.countDocuments()

    if (totalUsers >= 5) {
        const error = new Error('Registration limit reached — max 5 users allowed')
        error.statusCode = 403
        throw error
    }

    // ─────────────────────────────────────────
    // DUPLICATE EMAIL CHECK
    // User.create() bhi throw karta hai duplicate pe
    // lekin Mongoose error ugly hoti hai — pehle check karo
    // clean error message dene ke liye
    // ─────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })

    if (existingUser) {
        const error = new Error('Email already registered')
        error.statusCode = 409
        // 409 Conflict — resource already exists
        throw error
    }

    // ─────────────────────────────────────────
    // CREATE USER
    // Password hashing user.model.js ke pre('save')
    // hook mein hota hai — yahan plain text pass karo
    // ─────────────────────────────────────────
    const user = await User.create({ email, password })

    if (user) {
        return {
            _id:   user._id,
            email: user.email,
            token: generateToken(user._id)
        }
    } else {
        throw new Error('Invalid user data')
    }
}

// ─────────────────────────────────────────────────────────────────
// LOGIN USER
// ─────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {

    // ─────────────────────────────────────────
    // STEP 1: ACTIVE USER COUNT CHECK
    // Requirement: sirf 5 registered users
    // login kar paayein
    //
    // Kyun yahan check?
    // Agar koi seedha DB mein 6th user insert kar de
    // bypass karke — login pe bhi guard rakho
    //
    // countDocuments() vs find().length?
    // countDocuments() = O(1) — MongoDB metadata se
    // find().length    = O(n) — saare documents fetch karo phir count
    // HAMESHA countDocuments() use karo
    // ─────────────────────────────────────────
    const totalUsers = await User.countDocuments()

    if (totalUsers > 5) {
        const error = new Error('System user limit exceeded — contact admin')
        error.statusCode = 403
        throw error
        // Edge case — practically nahi hoga
        // lekin agar DB mein manually insert kiya toh
        // login bhi block hoga
    }

    // ─────────────────────────────────────────
    // STEP 2: USER DHUNDO BY EMAIL
    // ✅ BUG FIX from original code:
    // GALAT: User.findOne({ email, password })
    //   → MongoDB mein plain text password compare
    //   → bcrypt hash se match KABHI nahi hoga
    //   → har login pe "Invalid credentials" aata
    //
    // SAHI: Pehle email se dhundo
    //       Phir matchPassword() se compare karo
    // ─────────────────────────────────────────
    const user = await User.findOne({
        email: email.toLowerCase().trim()
        // lowercase + trim — same normalization jo register mein tha
        // "User@Gmail.com " → "user@gmail.com"
    })

    // ─────────────────────────────────────────
    // STEP 3: USER EXIST + PASSWORD MATCH
    // Dono check ek saath kyun?
    //
    // SECURITY REASON — Timing attack prevention:
    // ❌ GALAT approach (alag alag):
    //   if (!user) → "User not found"        (fast response)
    //   if (!match) → "Wrong password"        (slow — bcrypt runs)
    //   Attacker timing measure karke jaanta hai
    //   email exist karta hai ya nahi
    //
    // ✅ SAHI approach (combined):
    //   Dono cases mein same error message
    //   Dono cases mein similar response time
    //   (matchPassword false return karta hai fast
    //    agar user null ho — short circuit)
    // ─────────────────────────────────────────
    const isMatch = user && await user.matchPassword(password)
    // user && — agar user null hai toh matchPassword() call hi nahi hoga
    // matchPassword() — user.model.js mein defined
    // bcrypt.compare(enteredPassword, this.password)
    // Returns: Promise<boolean>

    if (!isMatch) {
        const error = new Error('Invalid email or password')
        error.statusCode = 401
        // 401 Unauthorized
        // "Invalid email or password" — intentionally vague
        // "User not found" mat likho — user enumeration attack
        throw error
    }

    // ─────────────────────────────────────────
    // STEP 4: TOKEN GENERATE KARO + RETURN
    // ─────────────────────────────────────────
    return {
        _id:   user._id,
        email: user.email,
        role:  user.role,
        token: generateToken(user._id)
        // role bhi return karo — frontend admin check ke liye
    }
}