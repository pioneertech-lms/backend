// import { bucketName } from "../../config/storageObject.js"
// import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
// import mongoose from "mongoose";
// import { Question } from "../../models/Question.js";

// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

// // // connect mongo
// try {
//     mongoose.set("strictQuery", true);
//     const { connection } = await mongoose.connect(process.env.MONGO_REMOTE_URI);
//     console.log(`MongoDB connected with ${connection.host}`);
// } catch (error) {
//     console.log(error);
// }

// const s3 = new S3Client({
//     s3ForcePathStyle: true,
//     credentials: {
//         accessKeyId: process.env.S3_ACCESS_KEY_ID,
//         secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
//     },
//     region: process.env.S3_REGION,
// });

// async function getQuestionImgsFromDb() {
//     let urls = [];
//     const questions = await Question.find({
//         $or: [
//             { question: { $regex: /questionImg-.*\.(.*)/ } },
//             { explanation: { $regex: /questionImg-.*\.(.*)/ } },
//             { 'options': { $elemMatch: { $regex: /questionImg-.*\.(.*)/ } } }
//         ]
//     });

//     for (const document of questions) {
//         const urlRegex = /assets\/questionImg-[\w-]+\.(\w+)/g;

//         // // Extract from 'question'
//         if (document.question) {
//             const questionUrls = document.question.match(urlRegex);
//             if (questionUrls) {
//                 urls = urls.concat(questionUrls);
//             }
//         }

//         // // Extract from 'explanation'
//         if (document.explanation) {
//             const explanationUrls = document.explanation.match(urlRegex);
//             if (explanationUrls) {
//                 urls = urls.concat(explanationUrls);
//             }
//         }

//         // // Extract from each 'option'
//         if (document.options && Array.isArray(document.options)) {
//             document.options.forEach(option => {
//                 const optionUrls = option.match(urlRegex);
//                 if (optionUrls) {
//                     urls = urls.concat(optionUrls);
//                 }
//             });
//         }

//         urls = urls.map(url => url.replace("assets/", ""));

//         // // Remove duplicates
//         urls = [...new Set(urls)];
//     }

//     return urls;
// }

// const usedQuestionImgs = await getQuestionImgsFromDb()
// console.log(usedQuestionImgs.length);

// async function deleteS3Objects(bucketName, objectsToDelete) {
//     const deleteParams = {
//         Bucket: bucketName,
//         Delete: {
//             Objects: objectsToDelete.map(key => ({ Key: key })),
//             Quiet: false
//         }
//     };

//     try {
//         const deletionResponse = await s3.send(new DeleteObjectsCommand(deleteParams));
//         return deletionResponse;
//     } catch (error) {
//         console.error("Error in batch deletion", error);
//         throw error;
//     }
// }

// export async function cleanupS3Bucket() {
//     let continuationToken;
//     let objectsToDelete = [];
//     const maxBatchSize = 1000;

//     do {
//         const response = await s3.send(new ListObjectsV2Command({
//             Bucket: bucketName,
//             Prefix: "questionImg-",
//             ContinuationToken: continuationToken,
//         }));

//         for (const object of response.Contents) {
//             if (!usedQuestionImgs.includes(object.Key)) {
//                 objectsToDelete.push(object.Key);
//                 if (objectsToDelete.length === maxBatchSize) {
//                     await deleteS3Objects(bucketName, objectsToDelete);
//                     console.log("Deleted 1000 objects")
//                     objectsToDelete = [];  // Reset the array after successful deletion
//                 }
//             } else {
//                 console.log("Skipped", object.Key)
//             }
//         }

//         continuationToken = response.NextContinuationToken;
//     } while (continuationToken);

//     // // Delete any remaining objects that didn't fill up the last batch
//     if (objectsToDelete.length > 0) {
//         await deleteS3Objects(bucketName, objectsToDelete);
//         console.log("Deleted remaining objects")
//     }
// }

export async function cleanupS3Bucket() {
    console.log("Not cleaning up s3 buckets yet");
}
