import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["random","live","manual","mock","pyq"],
        required:true
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
    exam:{
        type:String,
        enum:["jee","cet","neet"],
    },
    creator:{
        type: Schema.Types.ObjectId,
        ref: "user",
        // required: true,
    },
    duration:{
        type:Number,//in minutes
        // required:true
    },
    startTime:{
        type:Date,
    },
    endTime:{
        type:Date,
    },
    isSaved: {
        type: Boolean,
        default: true,
    },
  },
  {
    timestamps: true,
  }
);

// schema.pre("save", function(next) {
//   if (this.questions.length > 100) {
//     this.questions = this.questions.slice(0, 100);
//   }
//   next();
// });

export const Test = mongoose.model("test",schema);
