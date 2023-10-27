import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    number: {
        type:Number,
        required:true,
    },
    subject:{
        type:String,
        enum:["physics","chemistry","mathematics","biology"]
    },
    name:{
        type:String,
        required:true,
    },
    weighage:{
        type:Number,
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

export const Topic = mongoose.model("topic",schema); 
