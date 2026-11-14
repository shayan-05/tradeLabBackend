import {User} from "../model/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        
        if(!isValidObjectId(userId)){
            throw new ApiError(404,"Invalid User ID");
        }

        const user =await User.findById(userId);
     
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
     
        if(!accessToken || !refreshToken){
            throw new ApiError(404,"Error while generating access and refresh Token");
        }

        user.refreshToken= refreshToken

        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    }catch(error){
      
        throw new ApiError(500,"Something went wrong in token generation")
    }
}

const createAccount = asyncHandler(async(req,res)=>{
    
    const {name,email,password} = req.body;

    if([email,name,password].some((element)=>element?.trim()==="")){
        throw new ApiError(404,"All fields are required")
    }

    const existedUser = await User.findOne({email:email});

    if(existedUser){
        throw new ApiError(404,"User exist with this email id")
    }

    const user = await User.create({
        name:name,
        email:email,
        password:password
    })

    if(!user){
        throw new ApiError(404,"user not created");
    }

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,createdUser,"User created successfully"))
})

const loginUser= asyncHandler(async (req,res)=>{
    const {email,password}=req.body

    if(!email){
        throw new ApiError(400,"username or password is required")
    }
    const user=await User.findOne({
        email// check whether any of them exist in database
    })
    if(!user){
        throw new ApiError(400,"User is not registered")
    }

    const isPasswordValidate= await user.isPasswordCorrect(password)

    if(!isPasswordValidate){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:process.env.NODE_ENV === "production" ? "none" : "lax"
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User logged in successfully")
    )


})

const logoutUser = asyncHandler(async(req,res)=>{

    const userId = req.user._id;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId")
    }

    const user = await User.findById(userId);
  
    if(!user){
        throw new ApiError(404,"User not exist");
    }

    await User.findByIdAndUpdate(userId,
        {
            $unset:
                {
                    refreshToken:1
                }
        },
        {
            new:true
        }
    );

    const options= {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:process.env.NODE_ENV === "production" ? "none" : "lax"
    }
    return res.status(200).clearCookie("refreshToken",options)
    .clearCookie("accessToken",options).json(new ApiResponse(200,{},"User logout successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(400,"Error in accessing user")
    }
    return res.status(200).json(new ApiResponse(200,{user:user},"current user fetched successfully"))
})

export {createAccount,loginUser,logoutUser,getCurrentUser,generateAccessAndRefreshToken}
