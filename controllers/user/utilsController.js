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
