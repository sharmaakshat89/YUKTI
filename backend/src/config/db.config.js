import mongoose, { connect } from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB= async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('connected to database')
    }
    catch(err){
        console.log(`error:${err}`)
    }
}

export default connectDB