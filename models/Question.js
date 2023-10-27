import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    number:{
        type:Number,
    },
    marks:{
        type:Number,
        // required:true,
    },
    question:{
        type:String,
        required:true
    },
    options:[
        {
            type:String,
            required:true,
        }
    ],
    answer:{
        type:String,
        required:true,
    },
    explanation:{
        type:String,
    },
    topic: {
      type:String,
      required: true,
    },
    yearOfAppearance:{
        type:String,
    },
    exam:{
        type:String,
        enum:["cet","jee","neet"]
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

export const Question = mongoose.model("question",schema); 
