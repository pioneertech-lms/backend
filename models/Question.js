import mongoose, { Schema } from "mongoose";

const schema = new mongoose.Schema(
  {
    number:{
        type:Number,
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
    subject:{
        type: String,
        enum: ["physics","chemistry","mathematics","biology"]
    },
    creator:{
        type: Schema.Types.ObjectId,
        ref: "user",
        // required: true,
    },
    isCommon:{
      type:Boolean,
      default:false,
    }
  },
  {
    timestamps: true,
  }
);

schema.pre('save', async function (next) {
  if(this.subject){
    this.subject = this.subject.toLowerCase();
  }
  if(this.exam){
    this.exam = this.exam.toLowerCase();
  }

  if(!this.isNew){
    next();
  }
  try {
    const existingQuestion = await Question.findOne({
      number: this.number,
      creator: this.creator,
    });

    if (existingQuestion) {

      // Log the duplicate question to the unsavedQues array
      return next(new Error('Duplicate question number for the user'));
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

export const Question = mongoose.model("question",schema); 



