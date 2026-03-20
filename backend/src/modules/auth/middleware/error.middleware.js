/*Controller mein error aaya
            ↓
throw kiya ya next(error) call kiya
            ↓
Express ne dekha — 4 argument wala middleware hai
            ↓
error.middleware.js pakad lega automatically
            ↓
Formatted JSON response frontend ko */ 

export const errorHandler = (err, req, res, next) => {
    console.error(`ERROR: ${err.message}`)
    console.error(err.stack)// finds the error occured in which file

    const statusCode = err.statusCode || err.status || 500
    const message = err.message || 'Internal Server Error'

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })// dont send stack trace in production once app is deployed
}

export const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`)
    error.statusCode = 404
    next(error) // jab next() mein kuch bhi pass karo toh Express automatically 4-argument wale error middleware pe jump karta hai matlab errorHandler() automatically call ho jaayega
}// if user runs a route that doesnt exist