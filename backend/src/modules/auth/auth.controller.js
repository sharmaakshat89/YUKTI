// passes the data from req.body to the service , 
// and converts the resp received in JSON 

import { registerUser } from "./services/auth.services.js";


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