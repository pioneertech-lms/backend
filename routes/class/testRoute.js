import express from "express";
import {
    getAllTests,
    createTest,
    getSingleTest,
    updateTest,
} from "../../controllers/class/testController.js";

import {authorizedUser} from "../../middleware/accessAuth.js";

const router = express.Router();

router
  .route("/")
  .get(getAllTests)
  .post(authorizedUser,createTest);

router
    .route("/:id")
    .get(getSingleTest)
    .put(updateTest);


export default router;
