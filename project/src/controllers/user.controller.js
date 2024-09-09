import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js" ;
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"



export const registerUser= asyncHandler(async(req,res)=>{
   // get user details from frontend
   const {fullName, email, password, username }= req.body;


   // validate the feild data
   if([fullName, email, password, username].some(
    (feild)=>(feild?.trim()==="")
    )){
        throw new ApiError(400,"all fields are required")
   }


   // check if user is already registered
   const existingUser = User.findOne({
    $or: [ {username}, {email} ]
   })

   if(existingUser){
    throw new ApiError(400, " username or email is not unique ")
   }

   // check for images,avatar
   const localAvatarPath = req.files?.avatar[0]?.path;
   console.log(req.files);
   const localCoverImagePath = req.files?.coverTmage[0]?.path;

   if(!localAvatarPath){
    throw new ApiError(400, " Avatar image must be present ")
   }


   // upload them to cloudinary
   const avatar= await uploadOnCloudinary(localAvatarPath)
   const coverImage= await uploadOnCloudinary(localCoverImagePath)
   if(!avatar){
    throw new ApiError(400, " Avatar image must be present ")
   }


   // create user object- entry in db
   const user= await User.create({
    fullName,
    avatar: avatar.url,
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
   

