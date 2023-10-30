import express from "express";
import {  
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    userChangePassword,
    getAllClasses,
    createClass,
    getSingleClass,
    updateClass,
    deleteClass,
} from "../../controllers/admin/primaryController.js";
import { checkUserModuleAccess, authorizedUser, extractUserInfo } from "../../middleWares/accessAuth.js";
import { registerUser } from "../../controllers/user/authController.js";

const router = express.Router();

// TODO: add checkUserModuleAccess("role") for every request.
router
  .route("/users")
  .get(authorizedUser,getAllUsers)
  .post(authorizedUser,registerUser);
  // .post(authorizedUser,checkUserModuleAccess("admin"),registerUser);

router
  .route("/user/:id")
  .get(authorizedUser,getSingleUser)
  .put(authorizedUser,updateUser)
  .delete(authorizedUser,deleteUser);

router
  .route("/update-password/:id")
  .put(authorizedUser,userChangePassword);

  // class crud rautes = accessible for super admin only
router
  .route("/class")
  .get(authorizedUser,checkUserModuleAccess(),getAllClasses)
  .post(authorizedUser,checkUserModuleAccess(),createClass);
  
router
  .route("/class/:id")
  .get(authorizedUser,checkUserModuleAccess(),getSingleClass)
  .put(authorizedUser,checkUserModuleAccess(),updateClass)
  .delete(authorizedUser,checkUserModuleAccess(),deleteClass);


export default router;
