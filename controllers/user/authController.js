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
    $or: [{ phone: username }, { email: username }, {username:username}],
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

// register
export const registerUser = catchAsyncError(async (req, res, next) => {
 const {
    firstName,
    lastName,
    email,
    phone,
    username,
    password,
    confirmPassword,
    role,
    address,
    city,
    state,
    pincode,
    dob,
    gender,
    description,
    exams,
    subjects,
  } = req.body;

  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password and confirm password must be same.")
    );
  }

  let user = await User.findOne({
    $or: [{ email: email }, { phone: phone }, { username: username }],
    deleted: false,
    status: true,
  });

  if (user) {
    return next(new ErrorHandler("Email or Phone already registered.", 400));
  }

  let _user = {
    firstName,
    lastName,
    username,
    password,
    createdBy:req.user._id,
  };

  
  if(role){
    _user.role = role;
  }
  if(email){
    _user.email = email;
  }
  if(phone){
    _user.phone = phone;
  }
  if(dob){
    _user.dob = dob;
  }
  if(role){
    _user.role = role;
  }
  if(gender){
    _user.gender = gender;
  }
  if(description){
    _user.description = description;
  }
  if(subjects){
    _user.subjects = subjects;
  }
  if(exams){
    _user.exams = exams;
  }
  if(req.files['profileImg']){
    _user.profileImg = process.env.BACKEND_URL + (req.files.profileImg[0].path).slice(6);
  }
  if(req.files['logoImg']){
    _user.logoImg = process.env.BACKEND_URL + (req.files.logoImg[0].path).slice(6);
  }
  if(req.files['watermarkImg']){
    _user.watermarkImg = process.env.BACKEND_URL + (req.files.watermarkImg[0].path).slice(6);
  }
  

  if(address || city || state || pincode){
    let _location = {};

      if(address){
    _location.address = address;
    }
    if(city){
      _location.city = city;
    }
    if(state){
      _location.state = state;
    }
    if(pincode){
      _location.pincode = pincode;
    }

    _user.location = _location
  }

  user = await User.create(_user);

  sendToken(user, 200, res);
})

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

export const updateUserInfo = catchAsyncError(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    username,
    password,
    role,
    address,
    city,
    state,
    pincode,
    dob,
    gender,
    description,
    exams,
    subjects,
  } = req.body;

  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({message:"User not found"});
  }

  // if(req.user.role === "student" && req.user._id != req.params.id){
  //   return res.status(403).json({message:"You are not authorized to update this user"});
  // }

  if(firstName){
    user.firstName = firstName;
  }
  if(lastName){
    user.lastName = lastName;
  }
  if(username){
    user.username = username;
  }
  if(email){
    user.email = email;
  }
  if(phone){
    user.phone = phone;
  }
  if(dob){
    user.dob = dob;
  }
  if(role){
    user.role = role;
  }
  if(address){
    user.address = address;
  }
  if(city){
    user.city = city;
  }
  if(state){
    user.state = state;
  }
  if(pincode){
    user.pincode = pincode;
  }
  if(gender){
    user.gender = gender;
  }
  if(description){
    user.description = description;
  }
  if(subjects){
    user.subjects = subjects;
  }
  if(exams){
    user.exams = exams;
  }
  if(password){
    user.password = password;
  }
  if(req.files['profileImg']){
    user.profileImg = process.env.BACKEND_URL + (req.files.profileImg[0].path).slice(6);
  }
  if(req.files['logoImg']){
    user.logoImg = process.env.BACKEND_URL + (req.files.logoImg[0].path).slice(6);
  }
  if(req.files['watermarkImg']){
    user.watermarkImg = process.env.BACKEND_URL + (req.files.watermarkImg[0].path).slice(6);
  }

  try {
    await user.save();
    res.status(200).json({message:"User updated successfully"});
  } catch (error) {
    res.status(500).json({message:"Something went wrong"});
  }

});