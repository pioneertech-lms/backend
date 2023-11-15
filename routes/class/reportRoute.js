import express from "express";
import upload from "../../middleWares/uploads.js";
import {
    getAllReports,
    addReport,
    getReportByTest,
    updateReport,
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
    .route("/:teacherId")
    .get(authorizedUser,getAllReports)

export default router;