import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors' //for giving access to frontend
import helmet from 'helmet' //to avoid people from injecting malicious code , hiding info leakage
import morgan from 'morgan' //Every time a request hits your server, Morgan prints a summary in your terminal.shows The HTTP method the URL, the status code (200, 404, 500), and how long the server took to respond.
import connectDB from './config/db.config.js'
import authRoutes from './routes/auth.routes.js'
import { errorHandler, notFound } from './modules/auth/middleware/error.middleware.js'
import { setupMarketWS } from './modules/market/websocket/market.socket.js'
import signalRoutes from './modules/signal/routes/signal.routes.js'

dotenv.config() // enable env vars

//server instance
const app=express()

//connect to mongoDB 
connectDB()

//middlewares to be used 
app.use(helmet())// security of headers 
app.use(cors({origin:FRONTEND_URL || 'http://localhost:5173', credentials:true}))//only allowing requests through these two links, credentials-true will allow cookies on frontend
app.use(morgan('dev')) //data of each req in easily readable format
app.use(express.json()) // converts req body to CLEAN json. this should come after CORS placement 


app.use('api/v1/auth', authRoutes) // adding routes with versioning for future changes if any

app.use('/api/v1/signal',signalRoutes)


//health check
app.get('/health', (req,res)=>{ // to check if server is up or not
    res.status(200).json({success:true, status:'WE ARE UP AND RUNNING :)', timestamp: new Date().toISOString()}) //timestamp addition will help us know when we checked health status

})

app.use(notFound) // should come after routes, if invalid url we get 404 , and this errorhandler will catch it

// sabse LAST mein errorHandler  ye poori app ka safety net hai, every unhandled error will come here
app.use(errorHandler)
//PORT DEFINE

const PORT= process.env.PORT || 5000 


const server= app.listen(PORT , ()=>{
    console.log(`Server running on port: ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
})

setupMarketWS(server)// websocket needs an already running HTTP server, converts our HTTP connections into a persistent connection. 


export default server



/*
GET /api/v1/signal?symbol=EUR/USD&interval=1h
            ↓
protect     ← token hai? valid hai?
            ↓
getSignal   ← query params lo
            ↓
fetchForexData ← candles fetch karo (cache ya API)
            ↓
getUnifiedSignal ← RSI, ADX, HMA, SuperTrend
            ↓
200 + { signal, score, risk, indicators }
*/
