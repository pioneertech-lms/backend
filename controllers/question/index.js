import { catchAsyncError } from "../../middleWares/catchAsyncError.js"; 
import { Question } from "../../models/Question.js";

import xlsx from "xlsx";



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
            topic: regex,
          },
          {
            exam: regex,
          },
          {
            yearOfAppearance: regex,
          },
        ];
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
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
            ],
            metadata: [
              {
                $match: query,
              },
              {
                $count: "total",
              },
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
    const {id } = req.body;

    const questionFound = Question.findById(id);

    if(!questionFound){
        return res.status(404).json({message:"question not found!"});
    } else {
        questionFound.isDeleted = true;

        return res.status(200).json({message:"question deleted successfully"});
    }
})

export const addMultipleQuestions = catchAsyncError(async (req,res,next) => {

    const workbook = xlsx.readFile(`./public${(req.files.questionSet[0].path).slice(6)}`);

    const sheetNames = workbook.SheetNames;

    const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

    if(xlData.length==0){
        return res.status(502).json({message:"excel sheet is empty"});
    }

    let results = {
      unsavedQues:[],
      message:"questions added successfully"
    };
    for(let i =0; i<xlData.length ; i++){

      console.log(xlData[i]);

      let _question = {};

      _question.number=xlData[i].number;
      _question.question=xlData[i].question;
      _question.answer=xlData[i].answer;
      _question.topic=xlData[i].topic;

      let _options = []

      if(xlData[i].optionOne){
        _options.push(xlData[i].optionOne);
      }
      if(xlData[i].optionTwo){
        _options.push(xlData[i].optionTwo);
      }
      if(xlData[i].optionThree){
        _options.push(xlData[i].optionThree);
      }
      if(xlData[i].optionFour){
        _options.push(xlData[i].optionFour);
      }

      _question.options = _options;

      if(xlData[i].explanation){
        _question.explanation=xlData[i].explanation;
      }
      if(xlData[i].yearOfAppearance){
        _question.yearOfAppearance=xlData[i].yearOfAppearance;
      }
      if(xlData[i].exam){
        _question.exam=xlData[i].exam;
      }
      if(xlData[i].marks){
        _question.marks=xlData[i].marks;
      }

      try {
        await Question.create(_question);
      } catch (error) {
        // console.log(error._message,"THIS IS AN ERROR OCCURED");
        results.error = error._message;
        results.unsavedQues.push(xlData[i]);
      }
    }

    if(results.unsavedQues.length != 0) {
      results.message = "Error while adding few questions.please add them manually"
    }
    return res.status(200).json(results);
})