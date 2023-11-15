import express from "express";
import {
  loginUser,  
  registerUser,
  userChangePassword,
} from "../../controllers/user/authController.js";
import {authorizedUser, extractUserInfo } from "../../middleWares/accessAuth.js";

const router = express.Router();

router
  .route("/login")
  .post(extractUserInfo,loginUser);

router
  .route("/register")
  .post(authorizedUser, registerUser)

router
  .route("/change-password")
  .put(extractUserInfo,userChangePassword);

export default router;
