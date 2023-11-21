import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { uploadFile } from "../../config/storageObject.js"; // Adjust the path accordingly

export const uploadStatic = catchAsyncError(async (req, res, next) => {
  const files = req.files;
  const uploadedFiles = [];

  for (const fieldName in files) {
    const file = files[fieldName][0];

    const s3Url = await uploadFile(file);
    uploadedFiles.push(s3Url);
  }

  return res.status(200).json({ assets: uploadedFiles });
});
