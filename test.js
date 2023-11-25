import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

// Create an S3 client
const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAQDYZQCEFETP4BQFG",
    secretAccessKey: "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"
  },
  logger: console
});

// Function to list buckets
async function listBuckets() {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log("Success", data.Buckets);
  } catch (err) {
    console.log("Error", err);
  }
}

listBuckets();
