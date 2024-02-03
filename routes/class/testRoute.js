import express from "express";
import {
    getAllTeacherTests,
    getAllStudentTests,
    createTest,
    getSingleTest,
    updateTest,
    deleteTest,
    printTest
} from "../../controllers/class/testController.js";

import { authorizedUser } from "../../middleWares/accessAuth.js";

const router = express.Router();

router
  .route("/")
  .get(authorizedUser,getAllTeacherTests)
  .post(authorizedUser,createTest);

router
  .route("/student")
  .get(authorizedUser,getAllStudentTests);

router
    .route("/:id")
    .get(authorizedUser,getSingleTest)
    .put(authorizedUser,updateTest)
    .delete(authorizedUser,deleteTest);

router
  .route("/print/:id")
  .get(printTest);

export default router;
