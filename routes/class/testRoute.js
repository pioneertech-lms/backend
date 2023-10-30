import express from "express";
import {
    getAllTests,
    createTest,
    getSingleTest,
    updateTest,
} from "../../controllers/class/testController.js";

const router = express.Router();

router
  .route("/")
  .get(getAllTests)
  .post(createTest);

router
    .route("/:id")
    .get(getSingleTest)
    .put(updateTest);


export default router;
