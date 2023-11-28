import { bucketName, s3 } from "../../config/storageObject.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { catchAsyncError } from "../../middleWares/catchAsyncError.js";

export const uploadStatic = catchAsyncError(async (req, res, next) => {
  const files = req.files;
  const uploadedFiles = [];

  for (const file in files) {
    const url = process.env.BACKEND_URL + "/assets/" + files[file][0].key;
    uploadedFiles.push(url);
  }

  return res.status(200).json({ assets: uploadedFiles });
});

export const listMaterial = catchAsyncError(async (req, res, next) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
    }));

    const keys = (data.Contents ?? []).map(object => object.Key.replace(/^(material\/)/, ""));
    return res.status(200).json(keys)
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch material" })
  }
})
