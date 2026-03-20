// ✅ FIXED auth.services.js
import User from '../models/user.model.js'
import jwt from 'jsonwebtoken'

// Module level pe — saaf aur accessible
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

export const registerUser = async (email, password) => {
    const totalUsers = await User.countDocuments()

    if (totalUsers >= 10) {
        const error = new Error('Registration Limit reached')
        error.statusCode = 403
        throw error
    }

    const user = await User.create({ email, password })

    if (user) {
        return {
            _id: user._id,
            email: user.email,
            token: generateToken(user._id) // ab accessible hai
        }
    } else {
        throw new Error('Invalid user data')
    }
}


export const loginUser= async (email,password) =>{

    const user= await User.findOne({email,password})

    if(!user){

        const error = new Error('INVALID CREDENTIALS')
        error.statusCode=401 //unauth
        throw error
    }

    const isMatch= await user.matchPassword(password)// seeing if password matches , method created in the model file


    if (!isMatch){
        const error= new Error('INVALID CREDENTIALS')
        error.statusCode=401 //unauth
        throw error
    }

    return{
        _id:user._id,
        email:user.email,
        token:generateToken(user._id)
    }

}