import express from "express";
import {
  uploadStatic,
  listMaterial,
  getQueCountByTeacherId,
  getQueCountPerTopic
} from "../../controllers/user/utilsController.js";
import {upload} from "../../middleWares/uploads.js";
// import { extractUserInfo } from "../../middleWares/accessAuth.js";

const router = express.Router();

router
  .route("/uploads")
  .post(upload,uploadStatic);

router
  .route("/material")
  .get(listMaterial);

// get question count by teacher id
router
  .route("/que-count/:id")
  .get(getQueCountByTeacherId);

// get question count per topic per subject by teacher id
router
  .route("/que-topic/:id/")
  .get(getQueCountPerTopic);

export default router;
