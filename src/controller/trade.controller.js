import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../model/user.model.js";
import { Trade } from "../model/trade.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStockPrice } from "../utils/twelveData.js";
import { buyHolding, sellHolding } from "./holding.controller.js";
import PortfolioSnapshot from "../model/portfolioSnapshot.js";

const newTrade = asyncHandler(async (req, res) => {
    const { stockSymbol, side, quantity } = req.body;

    if (typeof stockSymbol !== "string" || !stockSymbol.trim()) {
        throw new ApiError(400, "Stock symbol must be defined");
    }

    if (!["BUY", "SELL"].includes(side)) {
        throw new ApiError(400, "Side must be BUY or SELL");
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new ApiError(400, "Quantity must be a positive integer");
    }

    const userId = req.user._id;
    const symbol = stockSymbol.trim().toUpperCase();

    // Fetch price outside the transaction (external API call).
    const price = await getStockPrice(symbol);

    if (!Number.isFinite(price) || price <= 0) {
        throw new ApiError(400, "Invalid stock price");
    }

    const total = price * quantity;
    const session = await mongoose.startSession();

    let result;

    try {
        await session.withTransaction(async () => {
            const user = await User.findById(userId).session(session);

            if (!user) {
                throw new ApiError(404, "User not found");
            }

            if (side === "BUY") {
                if (user.currentBalance < total) {
                    throw new ApiError(400, "Insufficient balance");
                }

                const holding = await buyHolding({
                    userId,
                    symbol,
                    quantity,
                    price,
                    session
                });

                user.currentBalance -= total;
                user.investedValue+=total;
                await user.save({ session });

                const [trade] = await Trade.create(
                    [{
                        buyer:userId,
                        stockSymbol: symbol,
                        side: "BUY",
                        price,
                        quantity
                    }],
                    { session }
                );

                const [portfolioSnapshot]=await PortfolioSnapshot.create([{
                    userId:req.user._id,
                    timeStamp:new Date(),
                    cashBalance:user.currentBalance,
                    holdingsValue:user.investedValue,
                    totalValue:user.investedValue+user.currentBalance
                
                }],{session})

                result = {
                    trade,
                    holding,
                    currentBalance: user.currentBalance
                };
            } else {

                const { holding, realizedProfit } = await sellHolding({
                    userId,
                    symbol,
                    quantity,
                    price,
                    session
                });

                user.currentBalance += total;
                user.realizedPL+=realizedProfit;
                user.investedValue-=holding.buyingPrice*quantity;
                await user.save({ session });

                const [trade] = await Trade.create(
                    [{
                        buyer:userId,
                        stockSymbol: symbol,
                        side: "SELL",
                        price:holding.buyingPrice,
                        quantity,
                        status:"COMPLETED",
                        sellingPrice:price
                    }],
                    { session }
                );
                const [portfolioSnapshot]=await PortfolioSnapshot.create([{
                    userId:req.user._id,
                    timeStamp:new Date,
                    cashBalance:user.currentBalance,
                    holdingsValue:user.investedValue,
                    totalValue:user.investedValue+user.currentBalance
                
                }],{session})
                result = {
                    trade,
                    holding,
                    realizedProfit,
                    currentBalance: user.currentBalance
                };
            }
        });
    } finally {
        await session.endSession();
    }

    return res.status(200).json(
        new ApiResponse(200, result, "Trade completed successfully")
    );
});

const searchStocks = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    throw new ApiError(400, "Enter at least 2 characters to search");
  }

  try {
    const response = await axios.get(
      "https://api.twelvedata.com/symbol_search",
      {
        params: {
          symbol: query.trim(),
          outputsize: 10,
          apikey: process.env.TWELVE_DATA_API_KEY,
        },
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        response.data.data ?? [],
        "Stocks searched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      502,
      error.response?.data?.message || "Stock search failed"
    );
  }
});

const getTradeHistory=asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    
    if(!isValidObjectId(userId)){
        throw new ApiError(404,"Invalid user id")
    }

    const trades = await Trade.find({buyer:userId,status:"COMPLETED"})
    
    return res.status(200).json(new ApiResponse(200,trades,"Trade history fetched successfully"))
})

export { newTrade,searchStocks,getTradeHistory };