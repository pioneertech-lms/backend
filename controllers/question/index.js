import { catchAsyncError } from "../../middleWares/catchAsyncError.js"; 
import { Question } from "../../models/Question.js";

import ExcelJS from "exceljs";
import { readFileSync } from "fs";

  export const getAllQuestions = catchAsyncError(async (req,res,next) => {
      let query = {
          isDeleted: false,
        };
      
        if(req.query.isDeleted=== "true"){
          query.isActive = true;
        }
      
        let limit = parseInt(req.query.perPage) || 10;
        let page = req.query.page ? req.query.page : 1;
        let skip = (page - 1) * (req.query.perPage ? req.query.perPage : 10);
        let sort = req.query.sort ? {} : { createdAt: -1 };
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
            
        const questions = await Question.aggregate(aggregateQuery);
      
        res.status(200).json({
          questions: questions[0].data,
          total: questions[0].metadata[0]
            ? Math.ceil(questions[0].metadata[0].total / limit)
            : 0,
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
        topic,
        yearOfAppearance,
        exam,
    } = req.body;

    
    const questionFound = await Question.findOne({question});
    if(questionFound){
        return res.status(501).json({message:"question already exist!"});
    }

    let _question =  {
        question,
        answer,
        options:[]
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

    if(options){
        for(let i=0; i< options.length;i++){
            _question.options.push(options[i])
        }
    }

    const questionCreate = await Question.create(_question);

    if(questionCreate){
        return res.status(200).json({message:"question added successfully"});
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
        isDeleted,
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
    if(isDeleted=="false"){
        questionFound.isDeleted = false;
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
        questionFound.isDeleted = true;
        await questionFound.save();
        return res.status(200).json({message:"question deleted successfully"});
    }
})

export const addMultipleQuestions = catchAsyncError(async (req,res,next) => {
  
const buffer = readFileSync(`./public${(req.files.questionSet[0].path).slice(6)}`);
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buffer);

const worksheet = workbook.worksheets[0];

if (worksheet.rowCount === 0) {
  console.error("excel sheet is empty");
    return res.status(502).json({ message: "excel sheet is empty" });
}

let results = {
  unsavedQues: [],
  message: "questions added successfully",
};

worksheet.eachRow(async (row, rowNumber) => {
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
  _question.creator = req.user._id;

  const images = worksheet.getImages();
  images.forEach((img) => {
    const imgRow = img.range.tl.row;
    const imageBuf = workbook.getImage(img.imageId);
    if (imgRow === rowNumber - 1) {
      const dataUrl = `<img src='data:image/${imageBuf.extension};base64,${imageBuf.buffer.toString('base64')}'></img> `;

      switch (img.range.tl.col) {
        case 2: // questionImage
          _question.question = _question.question + dataUrl;
          break;
        case 4: // optionOneImage
          _question.options[0] =_question.options[0] + dataUrl;
          break;
        case 6: // optionTwoImage
        _question.options[1] =_question.options[1] + dataUrl;
          break;
        case 8: // optionThreeImage
        _question.options[2] =_question.options[2] + dataUrl;
          break;
        case 10: // optionFourImage
        _question.options[3] =_question.options[3] + dataUrl;
          break;
        case 14: // Column 14: explanationImage
          _question.explanation = _question.explanation + dataUrl;
          break;
        default:
          break;
      }
    }
  });

  if(_question.number==="number"){
    return;
  }else {
    try {
      await Question.create(_question);
    } catch (error) {
      results.error = error._message;
      results.unsavedQues.push(row.values);
    }
  }
});
return res.status(200).json(results);
})