import express from 'express'
import {protect} from '../../auth/middleware/auth.middleware.js'
import { getAIAnalysis } from '../controllers/ai.controller.js'

const router=express.Router()

router.post('/analyze',protect , getAIAnalysis)

export default router