import express from "express";
import {
  loginUser,
  registerUser,
  updateUserInfo,
  userChangePassword,
  logoutUser,
} from "../../controllers/user/authController.js";
import {authorizedUser, extractUserInfo } from "../../middleWares/accessAuth.js";
import {upload} from "../../middleWares/uploads.js";

const router = express.Router();

router
  .route("/login")
  .post(extractUserInfo,loginUser);

  router
  .route("/logout")
  .post(authorizedUser, logoutUser);

router
  .route("/test")
  .get(authorizedUser, (req, res) => {
    res.json(req.user);
  })
  .post(authorizedUser, (req, res) => {
    res.json(req.user);
  })

router
  .route("/register")
  .post(authorizedUser,upload, registerUser)

router
  .route("/change-password")
  .put(extractUserInfo,userChangePassword);

router
  .route("/update/:id")
  .put(authorizedUser,upload,updateUserInfo)

export default router;
