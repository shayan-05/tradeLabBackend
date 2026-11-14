import { isValidObjectId } from "mongoose";
import { Holding } from "../model/holding.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStockPrice } from "../utils/twelveData.js";
export const buyHolding = async ({
    userId,
    symbol,
    quantity,
    price,
    session
}) => {
    let holding = await Holding.findOne({
        holder: userId,
        stockSymbol: symbol
    }).session(session);

    if (holding) {
        const oldQuantity = holding.quantity;
        const newQuantity = oldQuantity + quantity;

        holding.buyingPrice =
            (oldQuantity * holding.buyingPrice + quantity * price) /
            newQuantity;

        holding.quantity = newQuantity;
        await holding.save({ session });
    } else {
        [holding] = await Holding.create(
            [{
                holder: userId,
                stockSymbol: symbol,
                quantity,
                buyingPrice: price
            }],
            { session }
        );
    }

    return holding;
};

export const sellHolding = async ({
    userId,
    symbol,
    quantity,
    price,
    session
}) => {
    const holding = await Holding.findOne({
        holder: userId,
        stockSymbol: symbol
    }).session(session);

    if (!holding || holding.quantity < quantity) {
        throw new ApiError(400, "Insufficient shares available");
    }

    const realizedProfit = (price - holding.buyingPrice) * quantity;
    holding.quantity -= quantity;

    if (holding.quantity === 0) {
        await Holding.deleteOne({ _id: holding._id }).session(session);
        return { holding: null, realizedProfit };
    }

    await holding.save({ session });

    return { holding, realizedProfit };
};

export const getHoldings=asyncHandler(async(req,res)=>{
    
    const userId=req.user._id;
    const holdings =await Holding.find({holder:userId})
    
    if(!holdings){
        return res.status(200).json(new ApiResponse(200,{},"Holdings not exist"))
    }

    return res.status(200).json(new ApiResponse(200,holdings,"Holdings fetched successfully"))
})

export const getPL=asyncHandler(async(req,res)=>{
    
    const userId = req.user._id;

    const holdings =await Holding.find({holder:userId})

    if(!holdings){
        return res.status(200).json(new ApiResponse(200,{profitLoss:0},"Currently no holdings"))
    }
    let totalLP=0;
    holdings.map(async(holding)=>{
        const currPrice=await getStockPrice(holding.stockSymbol)
        totalLP+=(currPrice-holding.buyingPrice)*quantity;

    })
    
    return res.status(200).json(new ApiResponse(200,{profitLoss:totalLP},"Total LossProfit fetched successfully"))

})

const getStockQuote = asyncHandler(async (req, res) => {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== "string") {
    throw new ApiError(400, "Stock symbol is required");
  }

  try {
    const response = await axios.get(
      "https://api.twelvedata.com/price",
      {
        params: {
          symbol: symbol.trim().toUpperCase(),
          apikey: process.env.TWELVE_DATA_API_KEY,
        },
      }
    );

    if (!response.data?.price) {
      throw new ApiError(
        502,
        response.data?.message || "Unable to fetch stock price"
      );
    }

    const price = Number(response.data.price);

    if (!Number.isFinite(price)) {
      throw new ApiError(502, "Invalid price returned by market provider");
    }

    return res.status(200).json(
      new ApiResponse(200, { symbol, price }, "Stock price fetched successfully")
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      502,
      error.response?.data?.message || "Market data provider request failed"
    );
  }
});

export { getStockQuote };