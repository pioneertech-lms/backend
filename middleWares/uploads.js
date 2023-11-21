import path from 'path';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3 } from '../config/storageObject.js';

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'assets',
    acl: 'public-read', // Set the ACL (Access Control List) as needed
    key: function (req, file, cb) {
      const objectName = `assets/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, objectName);
    },
  }),
}).fields([
  { name: 'logoImg' },
  { name: 'watermarkImg' },
  { name: 'profileImg' },
  { name: 'questionImg' },
  { name: 'questionSet' },
]);
