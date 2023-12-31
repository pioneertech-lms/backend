import crypto from "crypto";
import slugify from "slugify";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { User } from "../../models/User.js";
import { Session } from "../../models/Session.js";
import { sendToken } from "../../utils/sendToken.js";
import { error } from "console";

//login
export const loginUser = catchAsyncError(async (req, res, next) => {
  const { username, password, role } = req.body;

  const user = await User.findOne({
    $or: [{ phone: username }, { email: username }, { username: username }], 
    status: true,
  }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Account with this credentials doesn't exist" });
  }

  if (user.status === false || user.isActive === false) {
    return res.status(403).json({ message: "Your account is deactivated. Please contact admin to retrieve your account." });
  }

  let isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password!" });
  }

  // Check if the user is already logged in from another device
  if (user.currentSessionId) {
    const currentSession = await Session.findOne({ sessionId: user.currentSessionId });
    if(currentSession) {
      // Invalidate the old session
      await Session.findOneAndDelete({ sessionId: user.currentSessionId });
      // Prompt user to login again
      return res.status(401).json({ message: "Login from another device detected. Login again." });
    }
  }

  // Create a new session
  const newSession = new Session({ userId: user._id });
  console.log("newSession", newSession)
  await newSession.save();

  // Update the current session ID in the user model
  user.currentSessionId = newSession.sessionId;
  await user.save();


  sendToken(user, newSession.sessionId, 200, res);
});

// Logout
export const logoutUser = catchAsyncError(async (req, res, next) => {
  // Delete the current session
  await Session.findOneAndDelete({ sessionId: req.user.currentSessionId });

  // Clear the current session ID in the user model
  req.user.currentSessionId = null;
  await req.user.save();

  req.logout((err) => {
    if (err) throw err;
    res.status(200).json({ message: "Logout successful" });
  });
});


// register
export const registerUser = catchAsyncError(async (req, res, next) => {
 const {
    createdBy,
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
    className,
    standard
  } = req.body;
  // console.log(req.body, req.files);

  // if (password !== confirmPassword) {
  //   return next(
  //     new ErrorHandler("Password and confirm password must be same.")
  //   );
  // }

  if(phone && phone.length !== 10){
    return res.status(400).json({message:"Phone number must be 10 digits"});
  }

  let user = await User.findOne({
    $or: [{ email: email }, { phone: phone }, { username: username }],
    deleted: false,
    status: true,
  });

  if (user) {
    return res.status(400).json({message:"Email or Phone already registered."});
  }

  let _user = {
    firstName,
    lastName,
    username,
    password,
    createdBy: createdBy || req.user._id,
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
  if(standard){
    _user.standard = Number(standard);
  }
  if(className){
    _user.className = className;
  }
  if(subjects){
    _user.subjects = Array.isArray(subjects) ? subjects: [subjects];
  }
  if(exams){
    _user.exams = Array.isArray(exams) ? exams: [exams];
  }
  if(req.files['profileImg']){
    _user.profileImg = new URL('/assets/'+req.files.profileImg[0].key, process.env.BACKEND_URL).toString();
  }
  if(req.files['logoImg']){
    _user.logoImg = new URL('/assets/'+req.files.logoImg[0].key, process.env.BACKEND_URL).toString();
  }
  if(req.files['watermarkImg']){
    _user.watermarkImg = new URL('/assets/'+req.files.watermarkImg[0].key, process.env.BACKEND_URL).toString();
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

  return res.status(200).json({message:"User created successfully",user});
  // sendToken(user, 200, res);
})

// change password
export const userChangePassword = catchAsyncError(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) return res.status(400).json({message:"Password and confirm password does't match"});
    // return next(
    //   new ErrorHandler("Password and confirm password does't match", 400)
    // );

  const user = await User.findOne({ email: req.user.email }).select(
    "+password"
  );
  const correctPass = await user.comparePassword(currentPassword);

  if (!correctPass) {
    return res.status(401).json({message:"Incorrect password"})
    // return next(new ErrorHandler("Incorrect password", 401));
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
    standard,
    exams,
    subjects,
    className,
  } = req.body;
  // console.log(req.body, req.files);

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
  if(standard){
    user.standard = Number(standard);
  }
  if(className){
    user.className = className;
  }
  if(subjects){
    user.subjects = Array.isArray(subjects) ? subjects: [subjects];
  }
  if(exams){
    user.exams = Array.isArray(exams) ? exams: [exams];
  }
  if(password){
    user.password = password;
  }
  if(req.files['profileImg']){
    user.profileImg = new URL('/assets/'+req.files.profileImg[0].key, process.env.BACKEND_URL).toString();
  }
  if(req.files['logoImg']){
    user.logoImg = new URL('/assets/'+req.files.logoImg[0].key, process.env.BACKEND_URL).toString();
  }
  if(req.files['watermarkImg']){
    user.watermarkImg = new URL('/assets/'+req.files.watermarkImg[0].key, process.env.BACKEND_URL).toString();
  }

  try {
    await user.save();
    res.status(200).json({message:"User updated successfully"});
  } catch (error) {
    res.status(500).json({message:"Something went wrong"});
  }

});
