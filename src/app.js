import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import userRouter from "./routes/user.routes.js"
import tradeRouter from "./routes/trade.routes.js"
import holdingRouter from "./routes/holding.route.js"
import marketRouter from "./routes/market.route.js"

const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
            return
        }

        callback(new Error("Not allowed by CORS"))
    },
    credentials: true
}))

app.use(express.json({limits:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"));
app.use(cookieParser())

app.use("/api/v1/user",userRouter)
app.use("/api/v1/trade",tradeRouter)
app.use("/api/v1/holding",holdingRouter)
app.use("/api/v1/market",marketRouter)
export{app}