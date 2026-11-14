import { createAccount,loginUser,logoutUser,getCurrentUser } from "../controller/user.controller.js";
import {Router } from "express"
import { verifyJWT } from "../middleware/auth.middleware.js";

const userRouter=Router()

userRouter.post("/create-user",createAccount)
userRouter.post("/login",loginUser)
userRouter.post("/logout",verifyJWT,logoutUser)
userRouter.get("/current-user",verifyJWT,getCurrentUser)

export default userRouter