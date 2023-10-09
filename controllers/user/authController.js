import crypto from "crypto";
import slugify from "slugify";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { User } from "../../models/User.js";
import { sendToken } from "../../utils/sendToken.js";

//login
export const loginUser = catchAsyncError(async (req, res, next) => {
  const { username, password, role } = req.body;

  const user = await User.findOne({
    $or: [{ phone: username }, { email: username }],
    deleted: false,
    status: true,
  }).select("+password");

  if (!user) {
    res.status(401).json({message:"Account with this credentials doesn't exist"})
    return next(
      new ErrorHandler("Account with this credentials doesn't exist.", 401)
    );
  }

  if (user.status === false) {
    return next(
      new ErrorHandler(
        "Your account is deactivate. Please contact admin to retrieve your account.",
        403
      )
    );
  }

  let isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({message:"Invalid login credentials"})
    return next(new ErrorHandler("Invalid login credentials", 401));
  }

  sendToken(user, 200, res);
});


// change password
export const userChangePassword = catchAsyncError(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    return next(
      new ErrorHandler("Password and confirm password does't match", 400)
    );

  const user = await User.findOne({ email: req.user.email }).select(
    "+password"
  );
  const correctPass = await user.comparePassword(currentPassword);

  if (!correctPass) {
    return next(new ErrorHandler("Incorrect password", 401));
  }

  user.password = newPassword;
  await user.save();

  // req.flash("success", "Password updated successfully.");
  // res.redirect("/api/user/profile");
});

