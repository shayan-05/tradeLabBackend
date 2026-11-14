import "dotenv/config"
import {app} from './app.js'
import { connectDB } from "./db/index.js";
import dns from "node:dns"
dns.setServers(["1.1.1.1","8.8.8.8"])
connectDB().then(()=>{
app.listen(process.env.PORT || 8000,(req,res)=>{
    console.log(`Server listening on port 8000`)
})})
.catch((error)=>{
    console.log("MongoDb connection failed !!! ",error)
})