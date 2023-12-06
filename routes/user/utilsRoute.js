import express from "express";
import {
  uploadStatic,
  listMaterial,
  getQueCountByTeacherId
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

export default router;
