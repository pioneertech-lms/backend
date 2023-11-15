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
    creator:{
        type: Schema.Types.ObjectId,
        ref: "user",
        // required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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


schema.index({ number: 1, creator: 1 }, { unique: true });

// Custom validation method to check for duplicates before saving
schema.pre("save", async function (next) {
  try {
    const existingQuestion = await Question.findOne({
      number: this.number,
      creator: this.creator,
      isDeleted: false,
    });

    if (existingQuestion) {
      const error = new Error("Duplicate number entered");
      error.code = "DUPLICATE_NUMBER_WARNING";
      throw error;
    }

    next();
  } catch (err) {
    next(err);
  }
});
export const Question = mongoose.model("question",schema); 



