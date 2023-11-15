import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "logoImg") {
      cb(null, "./public/uploads/classes/logo");
    }
    if (file.fieldname === "watermarkImg") {
      cb(null, "./public/uploads/classes/watermark");
    }
    if (file.fieldname === "profileImg") {
      cb(null, "./public/uploads/users/profile");
    }
    if (file.fieldname === "questionImg") {
      cb(null, "./public/uploads/questions/image");
    }
    if (file.fieldname === "questionSet") {
      cb(null, "./public/uploads/questions/excel");
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname +
        "-" +
        Date.now() +
        Math.floor(Math.random() * 90000) +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage }).fields([
  {
    name: "logoImg",
  },
  {
    name: "watermarkImg",
  },
  {
    name: "profileImg",
  },
  {
    name: "questionImg",
  },
  {
    name: "questionSet",
  },
]);

export default upload;
