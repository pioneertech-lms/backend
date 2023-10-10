import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { User } from "../../models/User.js";

export const deleteUser = catchAsyncError(async (req, res, next) => {
    const {id} = req.params;

    const user = await User.findById(id);

    if(user){
        user.isDeleted = true;
        user.save();

        return res.status(200).json({message:"User deleted successfully"});
    } else {
        return res.status(404).json({message:"User not found"});
    }
});
