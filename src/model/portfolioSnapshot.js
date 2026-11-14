import mongoose from "mongoose";

const portfolioSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },

  cashBalance: {
    type: Number,
    required: true,
  },

  holdingsValue: {
    type: Number,
    required: true,
  },

  totalValue: {
    type: Number,
    required: true,
  },
});

const PortfolioSnapshot = mongoose.model(
  "PortfolioSnapshot",
  portfolioSnapshotSchema
);

export default PortfolioSnapshot