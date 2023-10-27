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

router
  .route("/users")
  .get(authorizedUser,checkUserModuleAccess("admin"),getAllUsers)
  .post(authorizedUser,registerUser);
  // .post(authorizedUser,checkUserModuleAccess("admin"),registerUser);

router
  .route("/user/:id")
  .get(authorizedUser,checkUserModuleAccess("admin"),getSingleUser)
  .put(authorizedUser,checkUserModuleAccess("admin"),updateUser)
  .delete(authorizedUser,checkUserModuleAccess("admin"),deleteUser);

router
  .route("/update-password/:id")
  .put(authorizedUser,checkUserModuleAccess("admin"),userChangePassword);

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
