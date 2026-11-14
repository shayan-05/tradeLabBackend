import { newTrade } from "../controller/trade.controller.js";
import {Router} from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getStockPrice } from "../utils/twelveData.js";
import { getTradeHistory } from "../controller/trade.controller.js";
const tradeRouter = Router()

tradeRouter.post("/new-trade",verifyJWT,newTrade)
tradeRouter.get("/getStockPrice",verifyJWT,getStockPrice)
tradeRouter.get("/history",verifyJWT,getTradeHistory)
export default tradeRouter