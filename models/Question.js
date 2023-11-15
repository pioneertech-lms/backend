import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    number:{
        type:Number,
        unique:true,
        required:true,
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
      type:Number,
      enum:[1,2,3,4],
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
    creator:{
        type: Schema.Types.ObjectId,
        ref: "user",
        // required: true,
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


schema.index({ number: 1, creator: 1 }, { unique: true });

export const Question = mongoose.model("question",schema); 
