import express from "express";
import {upload } from "../../middleWares/uploads.js";
import {
    getAllReports,
    getSingleReport,
    addReport,
    getReportByTest,
    updateReport,
    getAnalysisReport,
    getReportByStudent
} from "../../controllers/class/reportController.js";

import { checkUserModuleAccess, authorizedUser } from "../../middleWares/accessAuth.js";

const router = express.Router();


router
.route("/test/:testId")
    .get(authorizedUser,getReportByTest)
    .post(authorizedUser,addReport)
    // .put(updateReport);


// for teacher to get student's report
router
    .route("/student/:studentId")
    .get(authorizedUser,getReportByStudent)

router
    .route("/teacher/:teacherId")
    .get(authorizedUser,getAllReports)


// analysis report
router
    .route("/analysis/:studentId")
    .get(authorizedUser,getAnalysisReport)

router
    .route("/:id")
    .get(authorizedUser, getSingleReport)

export default router;