import { bucketName, s3 } from "../../config/storageObject.js";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Question } from "../../models/Question.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export const uploadStatic = catchAsyncError(async (req, res, next) => {
  const files = req.files;
  const uploadedFiles = [];

  for (const file in files) {
    const url = process.env.BACKEND_URL + "/assets/" + files[file][0].key;
    uploadedFiles.push(url);
  }

  return res.status(200).json({ assets: uploadedFiles });
});

export const listMaterial = catchAsyncError(async (req, res, next) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "material/"
    }));

    const contents = (data.Contents ?? []);

    // Process Question Banks
    const questionBanks = contents
      .filter(object => object.Key.startsWith("material/question-bank/") && object.Key !== "material/question-bank/")
      .reduce((acc, object) => {
        const path = object.Key.replace("material/question-bank/", "");
        const [examName, yearWithExtension] = path.split('/');
        if (!acc[examName]) {
          acc[examName] = {};
        }
        const year = yearWithExtension.replace('.pdf', '');
        acc[examName][year] = new URL("assets/" + object.Key, process.env.BACKEND_URL);
        return acc;
      }, {});

    // Process Formulae
    const formulae = contents
      .filter(object => object.Key.startsWith("material/formulae/") && object.Key !== "material/formulae/")
      .reduce((acc, object) => {
        const path = object.Key.replace("material/formulae/", "");
        const [examName, subject, grade, chapterWithExtension] = path.split('/');
        if (!acc[examName]) {
          acc[examName] = {};
        }
        if (!acc[examName][subject]) {
          acc[examName][subject] = {};
        }
        if (!acc[examName][subject][grade]) {
          acc[examName][subject][grade] = {};
        }
        const chapter = chapterWithExtension.replace('.pdf', '');
        acc[examName][subject][grade][chapter] = new URL("assets/" + object.Key, process.env.BACKEND_URL);
        return acc;
      }, {});

    return res.status(200).json({
      questionBanks,
      formulae
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to fetch material" })
  }
});

export const getQueCountByTeacherId = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  // get highest question number for that teacher id
  const highestQueNo = await Question.findOne({ teacher: id }).sort({ number: -1 });
  const queNo = highestQueNo?.number ?? 0;

  return res.status(200).json({ queNo: queNo + 1 })
})

export const getQueCountPerTopic = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { exam } = req.query;

  const count = await Question.aggregate([
    { $match: { $or: [{ creator: new ObjectId(id) }, { isCommon: true }], $and: [{ exam }] } },
    {
      $group: {
        _id: { topic: "$topic" },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalCount = count.reduce((acc, { _id, count }) => {
    acc[_id.topic] = count;
    return acc;
  }, {});

  return res.status(200).json(totalCount);
})
