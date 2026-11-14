import mongoose from "mongoose"

const holdingSchema = mongoose.Schema({

    stockSymbol:{
        type:String,
        required:true,
        upperCase:true,
        trim:true
    },
    quantity:{
        type:Number,
        required:true,
    },

    holder:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    buyingPrice:{
        type:Number,
        required:true
    }

},{timestamp:true})

const Holding = mongoose.model("Holding",holdingSchema)

export {Holding}