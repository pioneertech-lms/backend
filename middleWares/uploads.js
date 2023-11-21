import path from 'path';
import pkg from 'aws-sdk';
// import { uploadFile, getFileStream } from '../config/storageObject.js'; // Assuming the path is correct
import { S3Client, CreateBucketCommand ,PutObjectCommand } from '@aws-sdk/client-s3';

import multer from 'multer';
import multerS3 from 'multer-s3';

const s3 = new S3Client({
  endpoint: 'http://localhost:9000', // MinIO server endpoint or your S3 endpoint
  s3ForcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: 'wB1Vaus2GmHPthm3yldP', // Replace with your AWS access key
    secretAccessKey: 'bHNXmkr4k2dZiVIWs7QleZKPbvu7jGXNSALpPAbd', // Replace with your AWS secret key
  },
  region: 'us-east-1',
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'assets',
    acl: 'public-read', // Set the ACL (Access Control List) as needed
    key: function (req, file, cb) {
      const objectName = `uploads/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
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