

import { getUnifiedSignal } from "../../trading/services/quant.service.js";

import { fetchForexData } from "../../market/services/market.service.js";

export const getSignal = async(req,res)=>{

    try{
        const {symbol,interval}=req.query //taking from query params,because the GET req wont have a req.body
        //something like req.query= {symbol: 'EUR/USD', interval: '1h' }

/*Frontend → Backend    (data BHEJNA — query params, body)
Backend  → Frontend   (data BHEJNA — response) */

        if(!symbol || !interval){
            return res.status(400).json({//MEANS BAD REQ
                success: false,
                message:'SYMBOL & INTERVAL REQUIRED'
            })
        }

        const marketData = await fetchForexData(symbol,interval)
            //fetching candles from api

        if(!marketData.success){
            return res.status(503).json({ //service unavailable
                    success:false,
                    message:'MARKET DATA UNAVAILABLE'
            })
        }
        
        const signal = getUnifiedSignal(symbol, interval, marketData.data) //return hoga : { success, signal, score, risk, indicators }

        if(!signal.success){
            return res.status(422).json({
                success:false,
                message:signal.error // 422 means unprocessable, either insuff data or couldn't be processed
            })
        }
        return res.status(200).json({
            success:true,
            data:signal
        })//we get as resp : { signal: 'BUY', score: 0.82, risk: { stopLoss, takeProfit },
        //   indicators: { rsi, adx, supertrend, hma, macdHist, bbWidth } }

    }
    catch(err){
        console.error(`SIGNAL CONTROLLER ERR: ${err.message}`)
        return res.status(err.statusCode || 500).json({
            success: false,
            error: err.message || 'Internal Server Error'
        })
    }



}