import express from "express";
import upload from "../../middleWares/uploads.js";
import {
    getAllQuestions,
    addSingleQuestion,
    getSingleQuestion,
    updateQuestion,
    deleteSingleQuestion,
    addMultipleQuestions,
} from "../../controllers/class/questionController.js";

import { checkUserModuleAccess, authorizedUser } from "../../middleWares/accessAuth.js";

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
    .post(authorizedUser,upload,addMultipleQuestions);


export default router;
