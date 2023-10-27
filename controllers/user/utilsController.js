import { catchAsyncError } from "../../middleWares/catchAsyncError.js";

export const uploadStatic = catchAsyncError(async (req,res,next) => {

    const staticFile = process.env.BACKEND_URL + (req.files.questionImg[0].path).slice(6);
    return res.status(200).json({asset: staticFile});
})