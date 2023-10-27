import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    topic: {
      type: Schema.Types.ObjectId,
      ref: "topic",
      required: true,
    },
    readTime:{
        type:String,
    },
    content:{
        type:String,
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

export const Content = mongoose.model("content",schema); 
