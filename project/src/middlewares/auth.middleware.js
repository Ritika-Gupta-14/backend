import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


export const verifyJWT= asyncHandler(async(req,res,next)=>{

  try {
     const token= req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","")
  
     if(!token){
      throw new ApiError(401,"Unauthorized access")
     }
  
     const decodedInfo= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  
    const user=  await User.findById(decodedInfo?._id).select("-password -refreshToken")
  
    if(!user){
      throw new ApiError(401,"invalid access token")
    }
  
    req.user= user
    next()
  } catch (error) {
    throw new ApiError(401,error?.message||"something went wrong")
    
  }
})