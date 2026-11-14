import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    stockSymbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    side: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0.01,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a positive integer",
      },
    },

    status: {
      type: String,
      enum: ["EXECUTED", "COMPLETED"],
      default: "EXECUTED",
      required: true,
    },
    sellingPrice:{
        type: Number,
        min: 0.01,
    }
  },
  {
    timestamps: true,
  }
);

tradeSchema.index({ userId: 1, createdAt: -1 });

export const Trade = mongoose.model("Trade", tradeSchema);