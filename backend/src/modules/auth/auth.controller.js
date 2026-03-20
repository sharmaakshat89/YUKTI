// passes the data from req.body to the service , 
// and converts the resp received in JSON 

import { registerUser } from "./services/auth.services.js";
import { loginUser } from "./services/auth.services.js";

//to handle registration req
export const register=async(req,res)=>{

    try{
        const{email,password}=req.body //getting email,pswd from req

        const userData= await registerUser(email,password) // gives us a userData obj after checks which has id , email, token

        return res.status(201).json({ //201: user created 
            success:true, // Agar error aaye toh frontend pe likh denge: if (res.data.success) { ... }.
            message:'USER REGISTERED SUCCESSFULLY',
            data:userData //will have email,id,token
        })
    }
    catch(err){ // catching errors specifically the user limit reached
        console.error(`registration error: ${err.message}`)
        return res.status(err.statusCode || 500).json({
            success:false,
            error:err.message || "Internal server error"
        })
    }
}

//to handle login

export const login= async(req,res)=>{

    try{
        const {email , password} = req.body
        const userData= await loginUser(email, password)

        return res.status(200).json({
            success:true,
            message:'LOGIN SUCCESSFUL',
            data: userData
        })

    }catch(err){
        console.error( `LOGIN ERROR:${err.message}`)

        return res.status(err.statusCode || 500).json({
            success:false,
            error:err.message || 'INVALID SERVER ERROR'
        })

    }
}

/*
  register aur login controllers almost identical :

1. try-catch 
2. req.body se data 
3. service calling
4. resp in the same shape


Fark sirf teen jagah:
```
register → registerUser() call    login → loginUser() call
register → 201 status             login → 200 status
register → "USER REGISTERED"      login → "LOGIN SUCCESSFUL"
 */