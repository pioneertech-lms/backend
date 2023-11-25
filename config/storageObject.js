import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
config({ path: "./config/config.env" });

const s3Config = {
  s3ForcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  region: process.env.S3_REGION,
};
if (process.env.NODE_ENV !== "production" && process.env.S3_ENDPOINT) s3Config.endpoint = process.env.S3_ENDPOINT;

export const s3 = new S3Client(s3Config);

export const bucketName = 'codo-lms-data';

// const createBucketIfNotExists = async () => {
//   try {
//     await s3.headBucket({ Bucket: bucketName }).promise();
//   } catch (err) {
//     if (err.code === 'NotFound') {
//       // Bucket does not exist, create it
//       await s3.createBucket({ Bucket: bucketName, ACL: 'private' }).promise();
//     } else {
//       throw err; // Other errors should be propagated
//     }
//   }
// };

export const getFileStream = async (req, res, next) => {
  const command = new GetObjectCommand({
    Key: req.params.objectId,
    Bucket: bucketName,
  });
  try {
    const object = await s3.send(command);
    res.type(req.params.objectId.split('.').pop() ?? "application/octet-stream");
    return object.Body.pipe(res);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Not Found');
  }
};

// (async () => {
//   try {
//     await createBucketIfNotExists();
//     console.log('Bucket created or already exists');
//   } catch (err) {
//     console.error('Error creating bucket:', err);
//   }
// })();
