import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    student:{
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    teacher:{
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    test:{
      type: Schema.Types.ObjectId,
      ref: "test",
      required: true,
    },
    attempted:{
      type: Number,
      required:true,
    },
    correct:{
      type: Number,
      required:true,
    },
    incorrect:{
      type: Number,
      required:true,
    },
    obtainedMarks:{
      type:Number,
      required:true,
    },
    total:{
      type:Number,
      required:true
    },
    status:{
      type:Boolean,
      required:true,
    },
    remark:{
      type:String
    },
    questions:[
      {
        questionId:{
          type:Schema.Types.ObjectId,
          ref:"question",
          required:true,
        },
        selected:{
          type:String,
          required:true,
        },
        correct:{
          type:Boolean,
          required:true,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model("report",schema); 
