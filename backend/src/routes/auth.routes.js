// backend/src/modules/auth/routes/auth.routes.js

import express from 'express'
import {
    registerValidationRules,
    loginValidationRules,
    validate
} from '../modules/auth/middleware/auth.validator.js'
// ✅ BUG FIX: path fix — middleware is inside auth module
import { register, login } from '../modules/auth/auth.controller.js'

const router = express.Router()

// POST /api/v1/auth/register
router.post(
    '/register',
    ...registerValidationRules,
    validate,
    register
)

// POST /api/v1/auth/login
router.post(
    '/login',
    ...loginValidationRules,
    validate,
    login
)
console.log("validate:", typeof validate)
export default router