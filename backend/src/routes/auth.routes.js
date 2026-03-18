// defines the endpoints and tells the method(GET,POST) Attached to a specific controller

import express from 'express'
import { registerValidationRules, validate } from '../modules/auth/middleware/auth.validator.js'
import { register } from '../modules/auth/auth.controller.js'

const router = express.Router() //router ka instance

// for POST req

router.post('/register',registerValidationRules,validate,register)

export default router