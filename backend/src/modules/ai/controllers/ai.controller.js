import { getAIValidation } from "../services/ai.service.js";
import { fetchForexData } from "../../market/services/market.service.js";
import { getUnifiedSignal } from "../../trading/services/quant.service.js";

export const getAIAnalysis = async (req,res)=>{

    try{
        const{symbol,interval}=req.body
        if(!symbol || !interval){
            return res.status(400).json({
                success:false,
                message:'Symbol and interval are required'
            })
        }
        const marketData= await fetchForexData(symbol,interval)

        if(!marketData.success){
            return res.status(503).json({
                success:false,
                message:'Market data unavailable for AI analysis'
            })
        }
        const quantSignal=getUnifiedSignal(symbol,interval,marketData.data)

        if(!quantSignal.success){
            return res.status(422).json({
                success:false,
                message:'INSUFF DATA FOR ANALYSIS'
            })
        }

        const aiResult = await getAIValidation(
            symbol,interval,quantSignal,quantSignal.indicators,marketData.data
        )// AI service ko call karo — 5 cheezein do
        // symbol     — USD/INR
        // interval   — 1h
        // quantSignal — { signal, score, risk }
        // indicators  — quantSignal.indicators se nikale
        //               { rsi, adx, macdHist, bbWidth, supertrend, hma }
        // candles     — marketData.data — poore 100
        //               ai.service.js andar slice(-20) karega
        // await — Gemini API call hai — time lagega
        if(!aiResult.success){
            return res.status(503).json({
                success:false,
                message:aiResult.error
            })
        }
        return res.status(200).json({
            success: true,
            data: {
                quantSignal: {
                    signal: quantSignal.signal,
                    score: quantSignal.score,
                    risk: quantSignal.risk,
                    indicators: quantSignal.indicators
                },
                // quant ka data bhi bhejo —
                // frontend pe dono ek saath dikhenge
                // quant signal + AI validation side by side

                aiValidation: {
                    aiSignal: aiResult.data.aiSignal,
                    reasoning: aiResult.data.reasoning,
                    agreesWithQuant: aiResult.data.agreesWithQuant,
                    source: aiResult.source
                    // source — 'cache' ya 'api'
                    // frontend pe optionally dikhao
                    // "Cached response" — user ko pata chale
                }
            }
        })
    }catch(err){
        console.error(`AI Controller err:${err.message}`)
        return res.status(err.statusCode || 500).json({
            success:false,error:err.message || 'INTERNAL SERVER ERROR'
        })
    }
}


/*
USER CLICKED BUTTON ON FRONTEND{SYM : USD/INR, INTERVAL: "1H"} > REQ GOES TO SERVER.JS
THEN GOES TO AI.ROUTES.JS > THEN TO AI.CONTROLLER > 
*/




