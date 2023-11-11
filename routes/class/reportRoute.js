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
    .get(getReportByTest)
    .post(addReport)
    // .put(updateReport);


// for teacher to get student's report
router
    .route("/student/:studentId")
    .get(getReportByStudent)

router
    .route("/:teacherId")
    .get(getAllReports)

export default router;