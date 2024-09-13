import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js" ;
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken= async (userId)=>{
   try {
      const user= await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken= user.generateRefreshToken()

      user.refreshToken= refreshToken
     await user.save({validateBeforeSave: false})
   } catch (error) {
      throw new ApiError(500,"something went wrong - unable to generate tokens")
   }
    
   return {accessToken,refreshToken}
}

export const registerUser= asyncHandler(async(req,res)=>{
   // get user details from frontend
   console.log(req.body)
   const {fullName,email,password,username }= req.body;


   // validate the feild data
   if([fullName, email, password, username].some(
    (feild)=>(feild?.trim()==="")
    )){
        throw new ApiError(400,"all fields are required")
   }


   // check if user is already registered
   const existingUser = await User.findOne({
    $or: [ {username}, {email} ]
   })

   if(existingUser){
    throw new ApiError(400, " username or email is not unique ")
   }

   // check for images,avatar
   let localAvatarPath;
   let localCoverImagePath ;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      localAvatarPath =req.files.avatar[0].path;
     }
   console.log(req.files);

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      localCoverImagePath=req.files.coverImage[0].path;
     }
   // if(!localAvatarPath){
   //  throw new ApiError(400, " Avatar image must be present ")
   // }


   // upload them to cloudinary
   const avatar= await uploadOnCloudinary(localAvatarPath)
   const coverImage= await uploadOnCloudinary(localCoverImagePath)
   // if(!avatar){
   //  throw new ApiError(400, " Avatar image must be present ")
   // }


   // create user object- entry in db
   const user= await User.create({
    fullName,
    email,
    avatar: avatar?.url||"",
    coverImage: coverImage?.url || "",
    password,
    username: username.toLowerCase()
   })


   // check if user is created
   // remove password and refresh token 
   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser){
    throw new ApiError(500, "something went wrong... unable to register user")
   }

   // return response

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
   )


   
})

export const loginUser= asyncHandler(async(req,res)=>{
   //take values from req.body
   const {username,email,password}= req.body

   if (!(username||email)){
      throw new ApiError(400,"username or password is required")
   }

   const user= await User.findOne({
      $or: [{username},{email}]
   })

   if(!user){
      throw new ApiError(404,"User not found")
   }

   const isPasswordCorrect = await user.isPasswordCorrect(password)

   if(!isPasswordCorrect){
      throw new ApiError(400, "Invalid login credentials")
   }

   const{ refreshToken,accessToken}= await generateAccessAndRefreshToken(user._id)

   const loggedUser= User.findById(user._id).select("-password -refreshToken")

   const options={
      httpOnly: true,
      secure: true
   }

   res.status(200).
   cookie("refreshToken", refreshToken).
   cookie("accessToken", accessToken).json(
      new ApiResponse(200,
         {user: loggedUser,accessToken,refreshToken},
         "user logged in successfully")
   )

})
   
export const logoutUser= asyncHandler(async(req,res)=>{
   const user = await User.findByIdAndUpdate(req.user._id,
      {
      $set:{
         refreshToken:undefined
      }},
      {new:true}
      
      )
      
   const options={
      httpOnly: true,
      secure: true
   }

   return res.status(200).
   clearCookie("accessToken",options).
   clearCookie("refreshToken",options).
   json(new ApiResponse(200,{},"user logged out successfully"))

   
})

export const refreshAccessToken= async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken|| req.body.refreshToken

   if (!incomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
   }

 try {
   const decodedToken=  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
   const user = await User.findById(decodedToken?.id)
  
   if (!user){
     throw new ApiError(401, "invalid refresh token")
   }
  
   if (incomingRefreshToken!==user?.refreshToken){
     throw new ApiError(401, " refresh token is expired or used") 
   }
  
   const options={
     httpOnly: true,
     secured: true
   }
   const {accessToken,newrefreshToken}=await generateAccessAndRefreshToken(user._id)
  
   return res.status(200).
   cookie("accessToken", accessToken,options).
   cookie("refreshToken", newrefreshToken,options).
   json(
     new ApiResponse(
        200,
        {accessToken, newrefreshToken},
        "Access token refreshed"
     )
   )
 } catch (error) {
   throw new ApiError(401,error?.message||"invalid refresh token")
 }
}