import {Router} from "express"
import { getHoldings, getPL, getStockQuote } from "../controller/holding.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js"

const holdingRouter = Router()

holdingRouter.get("/holdings",verifyJWT,getHoldings)
holdingRouter.get("/pl",verifyJWT,getPL)
holdingRouter.get("/market/quote",verifyJWT,getStockQuote)

export default holdingRouter