import express from "express";
import {  
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    userChangePassword,
} from "../../controllers/admin/primaryController.js";
import { checkUserModuleAccess, authorizedUser, extractUserInfo } from "../../middleWares/accessAuth.js";
import { registerUser } from "../../controllers/user/authController.js";

const router = express.Router();

router
  .route("/users")
  .get(authorizedUser,checkUserModuleAccess(),getAllUsers)
  .post(authorizedUser,checkUserModuleAccess(),registerUser);

router
  .route("/user/:id")
  .get(getSingleUser)
  .put(updateUser)
  .delete(deleteUser);

router
  .route("/update-password/:id")
  .put(authorizedUser,checkUserModuleAccess(),userChangePassword);

export default router;
