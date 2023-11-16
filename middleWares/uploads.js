import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDirExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    return true;
  }
  fs.mkdirSync(filePath, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './public/uploads';

    if (file.fieldname === "logoImg") {
      uploadPath += '/classes/logo';
    } else if (file.fieldname === "watermarkImg") {
      uploadPath += '/classes/watermark';
    } else if (file.fieldname === "profileImg") {
      uploadPath += '/users/profile';
    } else if (file.fieldname === "questionImg") {
      uploadPath += '/questions/image';
    } else if (file.fieldname === "questionSet") {
      uploadPath += '/questions/excel';
    }

    ensureDirExists(uploadPath);
    cb(null, uploadPath);
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
