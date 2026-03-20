import {body,validationResult} from 'express-validator'

//defining validation rules

export const registerValidationRules = 
[
    body('email') // when checking req.body.email
    .isEmail() // check if the email format is correct
    .withMessage('ENTER VALID EMAIL'),//ERR MSG
    

    body('password')//for req.body.password
    .isLength({min:6})//atleast six chars
    .withMessage('PASSWORD IS TOO SMALL') //ERR MSG
    .trim() // REMoves unnecc spaces
]

//middleware that catches validationerrs

export const validate= (req,res,next) =>{ //std mdw syntax
    const errors=validationResult(req) // get all validation err from req obj

    if(errors.isEmpty()){
        return next() //if no err then move to controller logic
    }

    
    const extractedErrors=[] //empty array for errors
    errors.array().map(err=>
        extractedErrors.push({
            [err.path]:err.msg
        })
    )


// express-validator returns something like : 
/* errors.array = [
  {
    type: "field",
    value: "abc",
    msg: "Invalid email",           and what was the err msg
    path: "email",                   tells which field failed        
    location: "body"
  }          it is noisy, we dont need all of this @ frontend

  so final result of 
  errors.array().map(err=>
        extractedErrors.push({
            [err.path]:err.msg
        })
    ) is  

=   [
  { email: "Invalid email" },
  { password: "Too short" }
    ]
]*/


    return res.status(422).json({ //422 if that thing cant be processed
        success:false,
        errors:extractedErrors //here we have listed all validation errors
    })

}

