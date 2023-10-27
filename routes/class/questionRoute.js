import express from "express";
import upload from "../../middleWares/uploads.js";
import {
    getAllQuestions,
    addSingleQuestion,
    getSingleQuestion,
    updateQuestion,
    deleteSingleQuestion,
    addMultipleQuestions,
} from "../../controllers/question/index.js";

const router = express.Router();

router
  .route("/")
  .get(getAllQuestions)
  .post(addSingleQuestion);

router
    .route("/:id")
    .get(getSingleQuestion)
    .put(updateQuestion)
    .delete(deleteSingleQuestion)

router
    .route("/bulk-add")
    .post(upload,addMultipleQuestions);


export default router;
