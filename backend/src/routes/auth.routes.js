// defines the endpoints and tells the method(GET,POST) Attached to a specific controller

import express from 'express'
import { registerValidationRules, validate } from '../modules/auth/middleware/auth.validator.js'
import { register } from '../modules/auth/auth.controller.js'
import { protect } from '../modules/auth/middleware/auth.middleware.js'
import { login } from '../modules/auth/auth.controller.js'

/*
Public routes :
POST /register     ← naya user, token nahi hai
POST /login        ← token lene aa raha hai

Protected routes (protect lagega):
GET  /profile      ← sirf logged in user dekhe
POST /trade        ← sirf logged in user trade kare
GET  /portfolio    ← sirf apna data dekhe
 */


const router = express.Router() //router ka instance
router.get('/profile', protect, getProfile)
// for POST req

router.post('/register', registerValidationRules, validate, register)

router.post('/login' , validate, login)// login doesnt need strict validation hence no validation mdw

export default router