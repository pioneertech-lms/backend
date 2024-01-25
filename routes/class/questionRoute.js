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
    checkImpQuestion,
    importQuestions
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
    
// import ques from data-entry panel
router
    .route("/import")
    .post(upload,importQuestions);

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
    .get(authorizedUser, getSingleQuestion)
    .put(authorizedUser, updateQuestion)
    .delete(authorizedUser, deleteSingleQuestion)



export default router;
