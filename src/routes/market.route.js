import {Router} from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { searchStocks} from "../controller/trade.controller.js";

const marketRouter = Router()

marketRouter.post("/search",verifyJWT,searchStocks)

export default marketRouter