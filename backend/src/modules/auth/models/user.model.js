import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema= new mongoose.Schema({
    email:{// will have three things email, password and role 
        type:String,
        required:[true, 'EMAIL MANDATORY'],
        unique: true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true, 'password is mandatory'],
        minlength:6
    },
    role:{
        type:String,
        enum:['user','admin'], //only these roles are allowed
        default:'user'
    },

}, {
    timestamps:true //will give timestamps each time user created or updated
})

//password hashing

userSchema.pre('save', async function (next){// to hash data before saving for added security
    if (!this.isModified('password')){// dont do this if password has not been changed
            return next()
    }
    const salt = await bcrypt.genSalt(10) //gen salt of 10 rounds
    this.password=await bcrypt.hash(this.password,salt) // conv pswd in text to hash
    
})

// for comparing password

userSchema.methods.matchPassword = async function (enteredPassword){// fnc to compare pswds during login
    return await bcrypt.compare(enteredPassword , this.password)//comparing the user entered pswd and the pswd they set during register
}


const User= mongoose.model('user',userSchema) // collection name and schema
//returns a mongoose model object
export default User 