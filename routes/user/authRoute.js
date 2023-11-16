import express from "express";
import {
  loginUser,  
  registerUser,
  updateUserInfo,
  userChangePassword,
} from "../../controllers/user/authController.js";
import {authorizedUser, extractUserInfo } from "../../middleWares/accessAuth.js";
import uploads from "../../middleWares/uploads.js";

const router = express.Router();

router
  .route("/login")
  .post(extractUserInfo,loginUser);

router
  .route("/register")
  .post(authorizedUser,uploads, registerUser)

router
  .route("/change-password")
  .put(extractUserInfo,userChangePassword);

router
  .route("/update/:id")
  .put(authorizedUser,uploads,updateUserInfo)
  
export default router;
