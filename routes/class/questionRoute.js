import express from "express";
import {upload} from "../../middleWares/uploads.js";
import {
    getAllQuestions,
    addSingleQuestion,
    getSingleQuestion,
    updateQuestion,
    deleteSingleQuestion,
    addMultipleQuestions,
    getImpQuestions,
    addImpQuestion,
    deleteImpQuestion,
    checkImpQuestion
} from "../../controllers/class/questionController.js";

import { checkUserModuleAccess, authorizedUser } from "../../middleWares/accessAuth.js";

const router = express.Router();

router
  .route("/")
  .get(authorizedUser,getAllQuestions)
  .post(authorizedUser,addSingleQuestion);

router
    .route("/bulk-add")
    .post(authorizedUser,upload,addMultipleQuestions);

router
    .route("/imp")
    .get(authorizedUser,getImpQuestions)
    .post(authorizedUser,addImpQuestion)
    .delete(authorizedUser,deleteImpQuestion)

router
    .route("/imp/check/:questionId")
    .get(authorizedUser,checkImpQuestion);

router
    .route("/:id")
    .get(getSingleQuestion)
    .put(updateQuestion)
    .delete(deleteSingleQuestion)



export default router;
