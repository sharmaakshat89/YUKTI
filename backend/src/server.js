import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors' //for giving access to frontend
import helmet from 'helmet' //to avoid people from injecting malicious code , hiding info leakage
import morgan from 'morgan' //Every time a request hits your server, Morgan prints a summary in your terminal.shows The HTTP method the URL, the status code (200, 404, 500), and how long the server took to respond.
import connectDB from './config/db.config.js'
import authRoutes from './routes/auth.routes.js'

dotenv.config() // enable env vars

//server instance
const app=express()

//connect to mongoDB 
connectDB()

//middlewares to be used 
app.use(helmet())// security of headers 
app.use(cors())
app.use(morgan('dev')) //data of each req in easily readable format
app.use(express.json()) // converts req body to CLEAN json


app.use('api/v1/auth', authRoutes) // adding routes with versioning for future changes if any


//health check
app.get('/health', (req,res)=>{ // to check if server is up or not
    res.status(200).json({success:true, status:'WE ARE UP AND RUNNING :)'})
})


//PORT DEFINE

const PORT= process.env.PORT || 5000 

app.listen(PORT, ()=>[
    console.log(`server running on port : ${PORT}`)
])




