import mongoose from "mongoose"

const connectDB=async()=>{
    try{
        const connectionInstance= await mongoose.connect(process.env.MONGODB_URI);
        console.log("MONGO DB CONNECTED Successfully !!! ",connectionInstance.connection.host)

    }catch(error){
        console.log("Error in connecting MONGODB")
        process.exit(1)
    }
}

export {connectDB}