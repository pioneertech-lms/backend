import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["random","linear","manual"],
        required:true
    },
    duration:{
        type:Number,//in minutes
        // required:true
    },
    subjects:[
        {
          type: String,
          enum: ["physics","chemistry","mathematics","biology"]
        }
      ],
    questions:[
        {
          type: Schema.Types.ObjectId,
          ref:"question",
          required:true,
        }
      ],
    isSaved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Test = mongoose.model("test",schema); 
