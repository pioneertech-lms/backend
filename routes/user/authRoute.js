import express from "express";
import {
  loginUser,  
  registerUser,
  userChangePassword,
} from "../../controllers/user/authController.js";
import { extractUserInfo } from "../../middleWares/accessAuth.js";

const router = express.Router();

router
  .route("/login")
  .post(extractUserInfo,loginUser);

router
  .route("/register")
  .post(registerUser)

router
  .route("/change-password")
  .put(extractUserInfo,userChangePassword);

export default router;
