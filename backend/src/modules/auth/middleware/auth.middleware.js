import jwt from 'jsonwebtoken'

import User from '../models/user.model'
/*Public routes (NO protect):
POST /register     ← naya user, token nahi hai
POST /login        ← token lene aa raha hai

Protected routes (protect lagega):
GET  /profile      ← sirf logged in user dekhe
POST /trade        ← sirf logged in user trade kare
GET  /portfolio    ← sirf apna data dekhe */
export const protect= async (req,resizeBy,next)=>{
    let token

    if(req.headers.authorisation && req.headers.authorisation.startsWith('Bearer')){
        //check if req has a header name authorisation , then check if that header auth word starts with word bearer plus token that frontend sends everytime once it gets it

        try{
            token=req.headers.authorisation.split(' ')[1]// split the authorisation named header and extract token out of it
            const decoded = jwt.verify(token,process.env.JWT_SECRET)
            // jwt.verify() do kaam karta hai ek saath:
            // 1. signature verify karta hai — token tamper toh nahi hua?
            // 2. token decode karta hai — andar ka data nikalta hai
            // agar token expired ya invalid ho — EXCEPTION throw hogi
            // decoded object kuch aisa dikhega: { id: '64abc...', iat: 1234, exp: 5678 }
            // iat = issued at (kab banaya), exp = expiry time
            // JWT_SECRET wahi hona chahiye jo token BANATE waqt use hua tha
            // alag secret doge toh verify fail ho jaayega
            req.user= await User.findById(decoded.id).select('-password')
            //find user using decoded.id, then after excluding passsword , send the complete data of the user as req.user
            next()
        }
        catch(error){
            console.error('AUTH MDW ERR:', error.message)
            return res.status(401).json({
                    success:false, message:'NOT AUTHORISED'})
            
                    }

    }
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'YOU HAVE no token'
        })
    }
}