import pkg from 'aws-sdk';
const {S3} = pkg;
import path  from'path';

const s3 = new S3({
  endpoint: 'http://localhost:9000', // MinIO server endpoint
  s3ForcePathStyle: true, // Required for MinIO
  accessKeyId: 'tFfzOrh9c8i9a4GzBBbO',
  secretAccessKey: 'a7ry1MfYtz9fspXxketwTFvfWetonJ1SNiiB1oKZ',
});

const bucketName = 'storage-bucket';

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

export const uploadFile = async (file) => {
  const objectName = `assets/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;

  await s3.upload({
    Bucket: bucketName,
    Key: objectName,
    Body: file.buffer,
  }).promise();

  return { objectName };
};

export const getFileStream = (req, res, next) => {
  const params = {
    Key: 'assets/'+req.params.objectId,
    Bucket: bucketName,
  };

  const s3Stream = s3.getObject(params).createReadStream();

  s3Stream.on('error', (err) => {
    console.error(err);
    res.status(500).send('Not Found');
  });

  s3Stream.pipe(res);
};

// (async () => {
//   try {
//     await createBucketIfNotExists();
//     console.log('Bucket created or already exists');
//   } catch (err) {
//     console.error('Error creating bucket:', err);
//   }
// })();
