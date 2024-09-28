import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query='', sortBy="createdAt", sortType="desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError("Invalid id")
    }

    const options={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    }
    const pipeline=[
        {$match:{
            owner:new mongoose.Types.ObjectId(userId),
            ...(query &&{title:{$regex:query,$options:"i"}})
        }},
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {$project:{
                        fullName:1,
                        username:1,
                        email:1,
                        avatar:1,
                    }}
                ]
            }
        },{
            $addFields:{
                $first:"$owner"
            }
        },
        {$sort:{
            [sortBy]:sortType==="asc"?1:-1
        }
    }]
    
    const videos= await Video.aggregatePaginate(Video.aggregate(pipeline),options)
    
    if(!videos.docs.length){
        throw new ApiError(404,"not found any field/ video")
    }
    return res.status(200).json(   
        new ApiResponse(200,videos,"videos fetched")
    )
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body
    let localVideoPath,localThumbnailPath;

    if(req.files && Array.isArray(req.files.videoFile)&& req.files.videoFile.length>0 )
   {  localVideoPath=req.files.videoFile[0]?.path}

   if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length>0){
    localThumbnailPath=req.files.thumbnail[0]?.path
   }
    if(!localVideoPath){
        throw new ApiError(400,"Video must be present")
    }
    if(!localThumbnailPath){
        throw new ApiError(400,"Thumbnail must be present")
    }
    const videoFile= await uploadOnCloudinary(localVideoPath)
    const thumbnail=await uploadOnCloudinary(localThumbnailPath)

    if(!videoFile.url){
        throw new ApiError(500,"Unable to upload video")
    }
    if(!thumbnail.url){
        throw new ApiError(500,"Unable to upload thumbnail")
    }

    const videoDetails = await cloudinary.api.resource(videoFile.public_id, { resource_type: 'video' });
    const duration = parseFloat(videoDetails.duration/60).toFixed(2);
    const video = await Video.create(
        {
            videoFile:videoFile.url,
            thumbnail: thumbnail.url,
            title,
            description,
            owner: req.user._id,
            duration

        }

    )

    return res.status(200).json(
        new ApiResponse(200, video,"video uploaded successfully")
    )

    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400,"video id must be present")
    }
    const video = await Video.aggregate([
        {$match:{
            _id:new mongoose.Types.ObjectId(videoId)
        }},{
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField:"_id",
                as: "owner",
                pipeline:[
                    {$project:{
                        username:1,
                        fullName:1,
                        email:1,

                    }}
                ]
            }
        }
    ])
    if(!video|| video.length===0){
        throw new ApiError(400,"video not found")
    }
    res.status(200).json(
        new ApiResponse(200,video[0],"video details fetched succesfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"no video id")
    }
    //TODO: update video details like title, description, thumbnail
    const {title, description}=req.body
    if(!(title||description)){
        throw new ApiError(400,"title or description not present")
    }
    const localThumbnailPath= req.files?.thumbnail[0]?.path
    if(!localThumbnailPath){
        throw new ApiError(400,"thumbnail is not there")
    }

    const thumbnailpath=await uploadOnCloudinary(localThumbnailPath)
    if(!thumbnailpath.url){
        throw new ApiError(500,"internal server eror - unable to upload thumbnail")
    }

    const video= await Video.findByIdAndUpdate(videoId,{
        $set:{
            title,
            description,
            thumbnail: thumbnailpath
        }

    },{
        new:true
    })

    return res.status(200).json(
        new ApiResponse(200,video,"video details updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}