import express from "express";
import {
    getAllTeacherTests,
    getAllStudentTests,
    createTest,
    getSingleTest,
    updateTest,
    generateTest
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
    .put(authorizedUser,updateTest);

router
  .route("/generate/:id")
  .get(authorizedUser,generateTest);

export default router;
