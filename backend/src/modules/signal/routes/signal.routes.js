import express from 'express'

import {protect} from '../../auth/middleware/auth.middleware.js'

import { getSignal } from '../controllers/signal.controllers.js'



const router=express.Router()


router.get('/' , protect, getSignal)


export default router