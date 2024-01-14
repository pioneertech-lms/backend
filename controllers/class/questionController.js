import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Question } from "../../models/Question.js";
import { ImpQuestion } from "../../models/ImpQuestion.js";
import axios from 'axios';

import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export const getAllQuestions = catchAsyncError(async (req,res,next) => {
    let query = {
      $or: [{ creator: new ObjectId(req.user._id) }, { isCommon: true }]
    };


    // Check if question.subject is one of req.user.subjects
      if (req.user.subjects && req.user.subjects.length > 0) {
        query.subject = { $in: req.user.subjects };
      }
      if (req.user.exams && req.user.exams.length > 0) {
        query.exam = { $in: req.user.exams };
      }

      if (req.query.exam) {
        const exams = Array.isArray(req.query.exam)
          ? req.query.exam
          : [req.query.exam];

        query.exam = {
          $in: exams,
        };
      }
      if (req.query.subject) {
        const subjects = Array.isArray(req.query.subject)
          ? req.query.subject
          : [req.query.subject];

        query.subject = {
          $in: subjects,
        };
      }

      let limit = parseInt(req.query.perPage) || 10;
      let page = parseInt(req.query.page, 10) || 1;
      let skip = (page - 1) * limit;
      let sort = req.query.sort ? {} : { number: -1 };
      let search = req.query.search;

      if (search) {
        let newSearchQuery = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const regex = new RegExp(newSearchQuery, "gi");
        query.$or = [
          {
            number: regex,
          },
          {
            question: regex,
          },
          {
            options: regex,
          },
          {
            explanation: regex,
          },
          {
            exam: regex,
          },
          {
            yearOfAppearance: regex,
          },
        ];
      }

      // query.$or = [
        // {
        //   subject:req.user.subjects,
        // },
      // ]

      // Filter by topics
      if (req.query.topic) {
        const topics = Array.isArray(req.query.topic) ? req.query.topic : [req.query.topic];
        query.topic = { $in: topics };
      }

      let aggregateQuery = [
        {
          $match: query,
        },
        {
          $sort: sort,
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limit },
            ],
            metadata: [
              { $count: "total" },
            ],
          },
        },
      ];
      // console.log(query);

      const questions = await Question.aggregate(aggregateQuery);
      const totalQuestions = questions[0].metadata[0] ? questions[0].metadata[0].total : 0;
      const totalPages = Math.ceil(totalQuestions / limit);

      res.status(200).json({
        questions: questions[0].data,
        total: totalPages,
        page,
        perPage: limit,
        search: search ? search : "",
      })
})

export const addSingleQuestion = catchAsyncError(async (req,res,next) => {
    const {
        number,
        marks,
        question,
        options,
        answer,
        explanation,
        isCommon,
        topic,
        yearOfAppearance,
        exam,
        subject
    } = req.body;


    const questionFound = await Question.findOne({question,creator:req.user._id});
    if(questionFound){
        return res.status(501).json({message:"question already exist!"});
    }

    let _question =  {
        question,
        answer,
        options:[],
        creator:req.user._id,
    };

    if(topic){
        _question.topic = topic
    }
    if(number){
        _question.number = number
    }
    if(marks){
        _question.marks = marks
    }
    if(explanation){
        _question.explanation = explanation
    }
    if(yearOfAppearance){
        _question.yearOfAppearance = yearOfAppearance
    }
    if(exam){
        _question.exam = exam
    }
    if(subject){
        _question.subject = subject
    }

    _question.isCommon= isCommon && isCommon === "true" ? true : false;

    if(options){
        for(let i=0; i< options.length;i++){
            _question.options.push(options[i])
        }
    }


    try {
      const questionCreate = await Question.create(_question);
      if(questionCreate){
        return res.status(200).json({message:"question added successfully"});
      }
    } catch (err) {
      let message = err.message || "Something went wrong";
      return res.status(501).json({message});
      // if (err.code === "DUPLICATE_NUMBER_WARNING") {
      // } else {
      //   console.error(err);
      // }
    }


})

export const getSingleQuestion = catchAsyncError(async (req,res,next) => {
    const {id} = req.params;
    let isImp;

    let question = await Question.findById(id);

    if(question){
      if(req.user.role === "student") {
        question = question.toObject();
        question.imp = Boolean(await ImpQuestion.count({ student: req.user._id, questions: { $in: [new ObjectId(id)] } }));
      }
      return res.status(200).json(question);
    }else {
        return res.status(404).json({message:"question not found"});
    }
})

export const updateQuestion = catchAsyncError(async (req,res,next) => {
    const {
        number,
        marks,
        question,
        options,
        answer,
        explanation,
        topic,
        yearOfAppearance,
        exam,
        subject,
    } = req.body;


    const questionFound = await Question.findById(req.params.id);

    if(!questionFound){
        return res.status(404).json({message:"question not found!"});
    }

    if(number){
        questionFound.number = number;
    }
    if(marks){
        questionFound.marks = marks;
    }
    if(question){
        questionFound.question = question;
    }
    if(answer){
        questionFound.answer = answer;
    }
    if(explanation){
        questionFound.explanation = explanation;
    }
    if(topic){
        questionFound.topic = topic;
    }
    if(yearOfAppearance){
        questionFound.yearOfAppearance = yearOfAppearance;
    }
    if(exam){
        questionFound.exam = exam;
    }
    if(subject){
        questionFound.subject = subject;
    }
    if(options){
        let opt = [];

        for(let i=0; i<options.length;i++){
            opt.push(options[i])
        }
        questionFound.options = opt;
    }

    const questionCreate = await questionFound.save();

    if(questionCreate){
        return res.status(200).json({message:"question updated successfully"});
    } else {
        return res.status(501).json({message:"Something went wrong"});
    }
})

export const deleteSingleQuestion = catchAsyncError(async (req,res,next) => {
    const questionFound = await Question.findById(req.params.id);

    if(!questionFound){
        return res.status(404).json({message:"question not found!"});
    }

    if(req.user.role === "admin" || questionFound.creator.toString() === req.user._id.toString()){

    await Question.deleteOne({ _id: questionFound._id });

      // questionFound.isDeleted = true;
      // await questionFound.save();
      return res.status(200).json({message:"question deleted successfully"});
    } else {
      return res.status(403).json({message:"You are not authorized to delete this question"});
    }

})

export const addMultipleQuestions = catchAsyncError(async (req,res,next) => {

  const url =process.env.BACKEND_URL +'/assets/'+ req.files.questionSet[0].key;
  const response = await axios.get(url, { responseType: 'arraybuffer' });

  // example https://drive.google.com/u/0/open?usp=forms_web&id=1yEPGyBkpnUiisXQ3JxBmtnYAncKdBcpJ
  // https://drive.google.com/open?id=10CUAmeEnzf6zHHG2rxG7LQrqFg37d1zG

const gdriveRegex1 = /https:\/\/drive\.google\.com\/u\/0\/open\?usp=forms_web&id=[a-zA-Z0-9_-]{10,}/g;
const gdriveRegex2 = /https:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]{10,}/g;

const replaceGdriveLink = async (text) => {
  try {
    if (!text) {
      return text;
      // throw new Error('Invalid text');
    }

    const string = text.toString();
    // console.log(string);

    const gdriveLinkMatches1 = string.match(gdriveRegex1);
    const gdriveLinkMatches2 = string.match(gdriveRegex2);
    const gdriveLinkMatches = gdriveLinkMatches1 || gdriveLinkMatches2;
    if (!gdriveLinkMatches) {
      return string;
    }

    const gdriveLink = gdriveLinkMatches[0];
    const fileId = gdriveLink.split("=")[1];
    // console.log("fileId", fileId);

    const gdriveResponse = await axios.get(
      `https://drive.google.com/uc?export=download&id=${fileId}`,
      { responseType: "arraybuffer" }
    );
    const fileBuffer = Buffer.from(gdriveResponse.data, "binary");

    const formData = new FormData();
    formData.append("questionImg", new Blob([fileBuffer]), "questionImg.jpg");
    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/utils/uploads`,
      formData
    );
    let imgPath = response.data.assets[0];
    const dataUrl = `<img src='${imgPath}' />`;
    const updatedString = string.replace(gdriveLink, dataUrl);

    // console.log("updatedString", updatedString);
    return updatedString;
  } catch (error) {
    console.error("Error:", error.message);
    return text;
  }
};

  // Get the buffer containing the file data
  const fileBuffer = Buffer.from(response.data, 'binary');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];

  if (worksheet.rowCount === 0) {
    console.error("excel sheet is empty");
    return res.status(502).json({ message: "excel sheet is empty" });
  }

  let results = {
    unsavedQues: [],
    count: 0,
    message: "questions added successfully",
  };

  const rowsData = [];
  worksheet.eachRow((row, rowNumber) => rowsData.push([row, rowNumber]));

  for await (const [row, rowNumber] of rowsData){
    // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));

    let _question = {};

    // Check for empty cells before processing
    _question.number = row.getCell(1).text || null; // Column 1: number
    _question.question = row.getCell(2).text || ""; // Column 2: question

    let _options = ["","","",""];

    if (row.getCell(4).text){ _options[0] =row.getCell(4).text}; // Column 4: optionOne
    if (row.getCell(6).text) {_options[1] = row.getCell(6).text}; // Column 6: optionTwo
    if (row.getCell(8).text){ _options[2] = row.getCell(8).text}; // Column 8: optionThree
    if (row.getCell(10).text){ _options[3] = row.getCell(10).text}; // Column 10: optionFour
    _question.options = _options;

    _question.answer = row.getCell(12).text || null; // Column 12: answer
    _question.explanation = row.getCell(13).text || ""; // Column 13: explanation
    _question.topic = row.getCell(15).text || null; // Column 15: topic
    _question.yearOfAppearance = row.getCell(16).text || null; // Column 16: yearOfAppearance
    _question.exam = row.getCell(17).text || null; // Column 17: exam
    _question.marks = row.getCell(18).text || null; // Column 18: marks
    _question.subject = row.getCell(19).text || null; // Column 18: subject
    _question.creator = req.user._id;

    const images = worksheet.getImages();
    for await (const img of images) {
      const imgRow = Math.floor(img.range.tl.row);
      const imgCol = Math.floor(img.range.tl.col);
      const imageBuf = workbook.getImage(img.imageId);

      if (imgRow === rowNumber - 1 && [2, 4, 6, 8, 10, 13].includes(imgCol)) {
        // Upload the files to S3
        const formData = new FormData();
        formData.append('questionImg', new Blob([imageBuf.buffer]), 'questionImg.jpg');

        const response = await axios.post(`${process.env.BACKEND_URL}/api/utils/uploads`, formData);

        let imgPath = response.data.assets[0];
        // console.log(imgPath)
        const dataUrl = `<img src='${imgPath}' />`;

        // const dataUrl = `<img src='data:image/${imageBuf.extension};base64,${imageBuf.buffer.toString('base64')}'></img> `;
        switch (imgCol) {
            case 2: // questionImage
              _question.question = _question.question ? _question.question + dataUrl : "";
              break;
            case 4: // optionOneImage
              _question.options[0] = _question.options.length != 0 && _question.options[0] != undefined ? _question.options[0] + dataUrl : "";
              break;
            case 6: // optionTwoImage
              _question.options[1] = _question.options.length != 0 && _question.options[1] != undefined ? _question.options[1] + dataUrl : "";
              break;
            case 8: // optionThreeImage
              _question.options[2] = _question.options.length != 0 && _question.options[2] != undefined ? _question.options[2] + dataUrl : "";
              break;
            case 10: // optionFourImage
              _question.options[3] = _question.options.length != 0 && _question.options[3] != undefined ? _question.options[3] + dataUrl : "";
              break;
            case 13: // Column 14: explanationImage
              _question.explanation = _question.explanation ? _question.explanation + dataUrl : "";
              break;
            default:
              break;
        }
      }
    };

    if(_question.number==="number" || !_question.number){
      continue;
    }else {
      let questionImg = "";
      let optionOneImg = "";
      let optionTwoImg = "";
      let optionThreeImg = "";
      let optionFourImg = "";
      let explanationImg = "";

      if(row.getCell(3).text !== null){
        questionImg = await replaceGdriveLink(row.getCell(3).text);
      }
      if(row.getCell(5).text !== null){
        optionOneImg = await replaceGdriveLink(row.getCell(5).text);
      }
      if(row.getCell(7).text !== null){
        optionTwoImg = await replaceGdriveLink(row.getCell(7).text);
      }
      if(row.getCell(9).text !== null){
        optionThreeImg = await replaceGdriveLink(row.getCell(9).text);
      }
      if(row.getCell(11).text !== null){
        optionFourImg = await replaceGdriveLink(row.getCell(11).text);
      }
      if(row.getCell(14).text !== null){
        explanationImg = await replaceGdriveLink(row.getCell(14).text);
      }

      _question.question = _question.question + questionImg;
      _question.options[0] = _question.options[0] + optionOneImg;
      _question.options[1] = _question.options[1] + optionTwoImg;
      _question.options[2] = _question.options[2] + optionThreeImg;
      _question.options[3] = _question.options[3] + optionFourImg;
      _question.explanation = _question.explanation + explanationImg;

    }

    if (req.body.isCommon == "true") {
      _question.isCommon = true;
    }

    try {
      const que = await Question.create(_question);
      results.count += 1;
    } catch (error) {
      if(error.message)
      results.unsavedQues.push({
        [_question.number]: error.message
      });
    }
  };
  results.message += ` with count: ${results.count}`
  return res.status(200).json(results);
})

export const getImpQuestions = catchAsyncError(async (req, res, next) => {
  const student = req.user._id;

  let limit = parseInt(req.query.perPage) || 10;
  let page = parseInt(req.query.page, 10) || 1;
  let skip = (page - 1) * limit;
  let sort = req.query.sort ? req.query.sort : { number: -1 };

  // Fetching impQuestions for the student
  const impQues = await ImpQuestion.findOne({ student });
  if (!impQues) {
    return res.status(404).json({ message: "No important questions found for this student." });
  }

  let questionIds = impQues.questions;

  // Constructing query for actual questions
  let questionQuery = { _id: { $in: questionIds } };

  // Apply search filter if present
  if (req.query.search) {
    let newSearchQuery = req.query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(newSearchQuery, "gi");
    questionQuery.$or = [
      { number: regex },
      { question: regex },
      { options: regex },
      { explanation: regex },
      { exam: regex },
      { yearOfAppearance: regex },
      { isCommon: true }
    ];
  }

  if (req.query.exam) {
    const exams = Array.isArray(req.query.exam)
      ? req.query.exam
      : [req.query.exam];

    questionQuery.exam = {
      $in: exams,
    };
  }
  if (req.query.subject) {
    const subjects = Array.isArray(req.query.subject)
      ? req.query.subject
      : [req.query.subject];

    questionQuery.subject = {
      $in: subjects,
    };
  }

  // Apply topic filter if present
  if (req.query.topic) {
    const topics = Array.isArray(req.query.topic) ? req.query.topic : [req.query.topic];
    questionQuery.topic = { $in: topics };
  }

  let aggregateQuery = [
    {
      $match: questionQuery
    },
    {
      $sort: sort
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ];

  const questions = await Question.aggregate(aggregateQuery);
  const totalQuestions = await Question.countDocuments(questionQuery);

  res.status(200).json({
    questions,
    total: totalQuestions,
    page,
    perPage: limit,
    search: req.query.search ? req.query.search : ""
  });
});

export const addImpQuestion = catchAsyncError(async (req, res, next) => {
  let student = req.user._id;
  const { questions, questionId } = req.body;

  const impQues = await ImpQuestion.findOne({ student });

  if (impQues) {
    // A new array to store unique questions
    let newQuestions = [];

    if (questions) {
      // Filter out questions that already exist in impQues.questions
      newQuestions = questions.filter(q => !impQues.questions.includes(q));
    } else if (questionId && !impQues.questions.includes(questionId)) {
      // Add questionId if it's not already in the list
      newQuestions.push(questionId);
    }

    // If there are new unique questions, add them to the database
    if (newQuestions.length > 0) {
      impQues.questions.push(...newQuestions);
      await impQues.save();
      return res.status(200).json({ message: "Imp question added successfully" });
    } else {
      return res.status(200).json({ message: "No new questions to add" });
    }
  } else {
    // Create a new ImpQuestion with either a list of questions or a single questionId
    const impQues = await ImpQuestion.create({
      student,
      questions: questions ? [...new Set(questions)] : [questionId]
    });
    return res.status(200).json({ message: "Imp question added successfully" });
  }
});

export const deleteImpQuestion = catchAsyncError(async (req,res,next) => {
  const student = req.user._id;
  const {questions, questionId} = req.body;

  const impQues = await ImpQuestion.findOne({student});

  if(impQues){
    if (questions) {
      impQues.questions = impQues.questions.filter(q => !questions.includes(q));
    } else if (questionId) {
      impQues.questions.pull(questionId);
    }

    await impQues.save();
    return res.status(200).json({message:"imp question removed successfully"});
  } else {
    return res.status(404).json({message:"No imp questions found"});
  }
})

export const checkImpQuestion = catchAsyncError(async (req,res,next) => {
  const student = req.user._id;
  const {questionId} = req.params;

  const impQues = await ImpQuestion.findOne({student});

  if(impQues){
    const isQuestionFound = impQues.questions.includes(questionId);
    return res.status(200).json({message: isQuestionFound ? "Imp question found" : "Imp question not found", isQuestionFound});
  } else {
    return res.status(404).json({isQuestionFound:false,message:"No imp questions found"});
  }
})
