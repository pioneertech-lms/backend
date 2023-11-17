import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      // required: [true, "Please enter your first name."],
    },
    lastName: {
      type: String,
      // required: [true, "Please enter your last name."],
    },
    username: {
      type: String,
      required: [true, "Please enter your username."],
      minLength: [4,"Username length must be 4 or more char"]
    },
    slug: {
      type: String,
      // required: true,
      // unique: true,
    },
    email: {
      type: String,
      // required: [true, "Please enter your email address."],
      validate: validator.isEmail,
      unique: [true, "Please use official email address."],
    },
    phone: {
      type: String,
      // required: [true, "Please enter your phone number."],
      unique:[true, "Please enter valid phone number"],
      minLength: [10, "Please enter valid phone number."],
    },
    location: {
      address: String,  
      city: String,
      state: String,
      pincode: Number
    },   
    dob: {
      type: Date,
    },
    gender: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please enter your password."],
      minLength: [6, "Password must be greater than 6 characters."],
      select: false,
    },    
    role: {
      type: String,
      enum: ["student","teacher","admin","superadmin"],
      default: "student",
    },
    description: {
      type: String,
      minLength: [10, "Description must be greater than 10 characters."],
    },
    profileImg: {
      type: String,
    },
    logoImg: {
      type: String,
    },
    watermarkImg: {
      type: String,
    },
    className: {
      type: String,
    },
    class:{
      type: Schema.Types.ObjectId,
      ref: "class",
      // required: true,
    },
    subjects:[
      {
        type: String,
        enum: ["physics","chemistry","mathematics","biology"]
      }
    ],
    standard:{
      type:Number,
      enum:[11,12]
    },
    exams:[
      {
        type:String,
        enum:["cet","jee","neet"]
      },
    ],
    modules: [
      {
        type: String,
      },
    ],
    otp:{
      type:String,
      default:"",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    isVerified:{
      type:Boolean,
      default:false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: String,
  },
  {
    timestamps: true,
  }
);
schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

schema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

schema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

schema.methods.getResetToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 50 * 60 * 1000;
  return resetToken;
};

export const User = mongoose.model("user",schema); 
