class ApiError extends Error{
    constructor(statusCode,message,stack="",errors=[]){
        super(message)
        this.statusCode=statusCode
        this.stack=stack
        this.message=message
        this.errors=errors
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}