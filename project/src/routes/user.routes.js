import {Router} from "express"
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage, updatePassword } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router= Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }

]), registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/update-password").post(verifyJWT, updatePassword)

router.route("/get-current-user").post(verifyJWT, getCurrentUser)

router.route("/update-account-details").post(verifyJWT, updateAccountDetails)

router.route("/update-avatar").post(upload.fields([
    {name:avatar,
    maxCount:1}]),
    verifyJWT,updateAvatar)

router.route("/update-cover-image").post(upload.fields([
    {name: updateCoverImage,
    maxCount:1}]),
    verifyJWT,updateCoverImage)

export default router