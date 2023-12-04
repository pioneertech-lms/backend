import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Question } from "../../models/Question.js";
import axios from 'axios';

import ExcelJS from "exceljs";
import { readFileSync } from "fs";

export const getAllQuestions = catchAsyncError(async (req,res,next) => {
    let query = {};

      // Check if question.subject is one of req.user.subjects
      if (req.user.subjects && req.user.subjects.length > 0) {
        query.subject = { $in: req.user.subjects };
      }
      if (req.user.exams && req.user.exams.length > 0) {
        query.exam = { $in: req.user.exams };
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
          {
            isCommon:true,
          }
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
      console.log(query);

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

    const question = await Question.findById(id);

    if(question){
        return res.status(200).json(question)
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
    } else {
      await Question.deleteOne({ _id: questionFound._id });

        // questionFound.isDeleted = true;
        // await questionFound.save();
        return res.status(200).json({message:"question deleted successfully"});
    }
})

export const addMultipleQuestions = catchAsyncError(async (req,res,next) => {

  const url =process.env.BACKEND_URL +'/assets/'+ req.files.questionSet[0].key;
  const response = await axios.get(url, { responseType: 'arraybuffer' });

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
  message: "questions added successfully",
};

const rowsData = [];
worksheet.eachRow((row, rowNumber) => rowsData.push([row, rowNumber]));

for await (const [row, rowNumber] of rowsData){
  // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));

  let _question = {};

  // Check for empty cells before processing
  _question.number = row.getCell(1).value || null; // Column 1: number
  _question.question = row.getCell(2).value || null; // Column 2: question

  let _options = [];
  if (row.getCell(4).value) _options.push(row.getCell(4).value); // Column 4: optionOne
  if (row.getCell(6).value) _options.push(row.getCell(6).value); // Column 6: optionTwo
  if (row.getCell(8).value) _options.push(row.getCell(8).value); // Column 8: optionThree
  if (row.getCell(10).value) _options.push(row.getCell(10).value); // Column 10: optionFour
  _question.options = _options;

  _question.answer = row.getCell(12).value || null; // Column 12: answer
  _question.explanation = row.getCell(13).value || null; // Column 13: explanation
  _question.topic = row.getCell(15).value || null; // Column 15: topic
  _question.yearOfAppearance = row.getCell(16).value || null; // Column 16: yearOfAppearance
  _question.exam = row.getCell(17).value || null; // Column 17: exam
  _question.marks = row.getCell(18).value || null; // Column 18: marks
  _question.subject = row.getCell(19).value || null; // Column 18: subject
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
          _question.question = _question.question ?? "" + dataUrl;
          break;
        case 4: // optionOneImage
          _question.options[0] =_question.options[0] ?? "" + dataUrl;
          break;
        case 6: // optionTwoImage
        _question.options[1] =_question.options[1] ?? "" + dataUrl;
          break;
        case 8: // optionThreeImage
        _question.options[2] =_question.options[2] ?? "" + dataUrl;
          break;
        case 10: // optionFourImage
        _question.options[3] =_question.options[3] ?? "" + dataUrl;
          break;
        case 13: // Column 14: explanationImage
          _question.explanation = _question.explanation ?? "" + dataUrl;
          break;
        default:
          break;
      }
    }
  };

  if(_question.number==="number" || !_question.number){
    continue;
  }else {
    // const que = await Question.create(_question);
    // console.log(que);
    // try {
    // } catch (error) {
    //   results.error = error._message;
    //   results.unsavedQues.push(row.values);
    // }
  }

  try {
    const que = await Question.create(_question);
  } catch (error) {
    results.unsavedQues.push({
      [_question.number]: error.message || 'Duplicate question number for the user'
    });
  }
};
return res.status(200).json(results);
})
