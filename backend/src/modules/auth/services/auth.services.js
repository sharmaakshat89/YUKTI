import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'

//this func returns an obj that has {_id: , email: , token: }
export const registerUser= async(email,password)=>{//pswd hashing done in model file
    // reg limit check
    const totalUsers=await User.countDocuments()// gets the count of current users fro DB

    if(totalUsers>=10){
        const error =new Error('Registration Limit reached')
        error.statusCode=403 //forbidden status code
        throw error // stops registration here
    }
    
    //creating new user
    const user= await User.create({email,password})
    if (user){ // if user created
        return {
            _id:user._id,
            email:user.email,
            token:generateToken(user._id) //jwt generated token
        }
    }
    else{
        throw new Error('Invalid user data') 
    }
    const generateToken=(id)=>{
        return jwt.sign({id}, process.env.JWT_SECRET,{expiresIn:'30d'})//this func takes the id , the jwt secret and the expiration time

    }

}