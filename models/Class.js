import mongoose, { Schema } from "mongoose";
import validator from "validator";


const schema = new mongoose.Schema(
  {
    className: {
      type: String,
      unique:[true,"Please enter unique class name."],
      required: [true, "Please enter your class name."],
    },
    logo: {
      type: String,
      required: [true, "Please enter logo img url."],
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    description: {
      type: String,
      minLength: [10, "Description must be greater than 10 characters."],
    },
    supportEmail: {
      type: String,
      // required: [true, "Please enter support email address."],
      validate: validator.isEmail,
      unique: [true, "Please use official email address."],
    },
    supportPhone: {
      type: String,
      // required: [true, "Please enter support phone number."],
      unique:[true, "Please enter valid phone number"],
      minLength: [10, "Please enter valid phone number."],
    },
    location: {
      address: String,  
      city: String,
      state: String,
      pincode: Number
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    noOfUsers:{
      type:Number,
      default: 100
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        // required: true,
      },
    ],
    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "user",
        // required: true,
      },
    ],
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
  },
  {
    timestamps: true,
  }
);

export const Class = mongoose.model("class",schema); 
