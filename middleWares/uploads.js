import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
}).fields([
  { name: "logoImg" },
  { name: "watermarkImg" },
  { name: "profileImg" },
  { name: "questionImg" },
  { name: "questionSet" },
]);