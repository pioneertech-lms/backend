import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import {Test} from "../../models/Test.js";
import { Question } from "../../models/Question.js";
import {ensureDirExists} from "../../utils/files.js";
import libre from 'libreoffice-convert';
import fs from 'fs';
import path from 'path';

export const getAllTeacherTests = catchAsyncError(async (req,res,next) => {
    let query = {
        creator:req.user._id,
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
            name: regex,
          },
          {
            type: regex,
          },
          {
            subjects: regex,
          },
          {
            duration: regex,
          },
          {
            questions: regex,
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
    
      const tests = await Test.aggregate(aggregateQuery);
    
      res.status(200).json({
        tests: tests[0].data,
        total: tests[0].metadata[0]
          ? Math.ceil(tests[0].metadata[0].total / limit)
          : 0,
        page,
        perPage: limit,
        search: search ? search : "",
      })
})

export const getAllStudentTests = catchAsyncError(async (req,res,next) => {
    let query = { 
        creator: req.user.createdBy ?? req.user._id,
    };

    if(req.query.isDeleted=== "true"){
        query.isActive = false;
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
                name: regex,
            },
            {
                type: regex,
            },
            {
                subjects: regex,
            },
            {
                duration: regex,
            },
            {
                questions: regex,
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

    const tests = await Test.aggregate(aggregateQuery);

    res.status(200).json({
        tests: tests[0].data,
        total: tests[0].metadata[0]
            ? Math.ceil(tests[0].metadata[0].total / limit)
            : 0,
        page,
        perPage: limit,
        search: search ? search : "",
    })
})


export const  createTest = catchAsyncError(async (req,res,next) => {
    const {
        name,
        type,
        duration,
        subjects,
        questions,
        startTime,
        endTime,
    } = req.body;

    if(!type){
      return res.status(500).json({message: "invalid test type!"});
    }

    const foundName = await Test.findOne({name});

    if(foundName){
        return res.status(501).json({message:"test with same name exist!"});
    }

    let _test = {
        name,
        type,
        creator: req.user._id,
    }
    if(duration){
     _test.duration= duration ;  
    }
    if(subjects){
     _test.subjects= subjects;   
    }
    if(startTime){
     _test.startTime= new Date(startTime);   
    }
    if(endTime){
     _test.endTime= new Date(endTime);   
    }
    
    if(_test.type === "random"){

      const {questions,total} = req.body;

      if(!questions || !total){
        return res.status(500).json({message:"pass questions and total!"});
      }

      // get last 5 random tests 
      const previousTests = await Test.find({ creator: req.user._id, type: 'random' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('questions -_id')
        .populate('questions');
      let usedQuestionIds = new Set();
      previousTests.forEach(test => {
          test.questions.forEach(question => {
              usedQuestionIds.add(question._id.toString());
          });
      });

      _test.questions = [];
      for (let { topic, noOfQue } of questions) {
        let uniqueQuestions = await Question.find({
            isDeleted: false,
            creator: req.user._id,
            topic: topic,
            _id: { $nin: Array.from(usedQuestionIds) }
        }).select('_id').limit(noOfQue);

        if (uniqueQuestions.length < noOfQue) {
            let deficit = noOfQue - uniqueQuestions.length;
            let additionalQuestions = await Question.find({
                isDeleted: false,
                creator: req.user._id,
                topic: topic,
                _id: { $nin: Array.from(uniqueQuestions.map(q => q._id)) }
            }).select('_id').limit(deficit);

            uniqueQuestions = uniqueQuestions.concat(additionalQuestions);
        }

        _test.questions.push(...uniqueQuestions.map(q => q._id));
    }

    }
    if(_test.type === "manual"){
        _test.questions = questions;
    }
    if(_test.type === "live"){
        
    }

    const createTest = await Test.create(_test);

    if(createTest){
        return res.status(200).json({message:"test created successfully"});
    } else {
        return res.status(501).json({message:"error creating test"});
    }

});

export const  getSingleTest = catchAsyncError(async (req,res,next) => {

    const foundTest = await Test.findById(req.params.id);

    if(foundTest){
        return res.status(200).json(foundTest);
    } else {
        return res.status(404).json({message:"test not found!"});
    }
});

export const  updateTest = catchAsyncError(async (req,res,next) => {
     const {
        name,
        type,
        subjects,
        questions,
        duration,
        startTime,
        endTime,
     } = req.body;

     const test = await Test.findById(req.params.id);

     if(!test){
        return res.status(404).json({message:"test not found"});
     } 

     if(name){
        test.name = name;
     }
     if(type){
        test.type = type;
     }
     if(subjects){
        test.subjects = subjects;
     }
     if(questions){
        test.questions = questions;
     }
     if(duration){
        test.duration = duration;
     }
     if(startTime){
        test.startTime = startTime;
     }
     if(endTime){
        test.endTime = endTime;
     }

     try {
        await test.save();
        return res.status(200).json({message:"test updated successfully"});
    } catch (error) {
         return res.status(501).json({message:"something went wrong",error:error.message});
     }
});

import puppeteer from 'puppeteer'

export const generateTest = catchAsyncError(async (req,res,next) => {
    const {id} = req.params;

    const testFound = await Test.findById(id)
            .populate('questions')
            .populate('creator');
            // return console.log(testFound);

    if(!testFound){
        return res.status(404).json({message:"test not found!"});
    }

    // generate pdf
    const questions = testFound.questions;
       const browser = await puppeteer.launch({ headless: false});
      const page = await browser.newPage();
  
      await page.goto(process.env.BACKEND_URL +'/templates/test_template.html');
  
      await page.evaluate((testFound,questions) => {
        if(testFound.name){
          const testName = document.getElementById('test-name');
          testName.innerHTML = testFound.name;
        }
        if(testFound.duration){
          const duration = document.getElementById('duration'); 
          duration.innerHTML = testFound.duration;
        }
        if(testFound.subjects){
          const subjects = document.getElementById('subjects');
          subjects.innerHTML = testFound.subjects.join(', ');
        }
        if(testFound.creator.logo){
          const logo = document.getElementById('logo');
          logo.setAttribute('src', testFound.creator.logo)
        }
        if(testFound.creator.watermark){
          const watermark = document.getElementById('watermark');
          watermark.setAttribute('src', testFound.creator.watermark)
        }
        const questionsContainer = document.getElementById('questions-container');
          questions.forEach((question,i) => {
              const questionHTML = `
                  <div class="question">
                      <p>${i+1}. ${question.question}</p>
                      <div class="options">
                          ${question.options.map((option, index) => `<label><input type="radio" name="q${i}" value="${index}"> ${option}</label><br>`).join('')}
                      </div>
                  </div>
              `;
              questionsContainer.innerHTML += questionHTML;
          });
      }, testFound,questions);
  
      ensureDirExists("./public/generated");
      let pdfPath = `./public/generated/questionPaperPdf-${Date.now() +Math.floor(Math.random() * 90000)}.pdf`
      let docPath = `./public/generated/questionPaperDoc-${Date.now() +Math.floor(Math.random() * 90000)}.docx`
      // Generate PDF with watermark
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
      
      await browser.close();

      // converting to docx
      try {
        const tempDir = path.dirname(pdfPath);
        fs.mkdirSync(tempDir, { recursive: true });
    
        const input = fs.readFileSync(pdfPath);
    
        libre.convert(input, '.docx', undefined, (err, result) => {
          if (err) {
            console.error(`Error converting PDF to DOCX: ${err}`);
          } else {
            fs.writeFileSync(docPath, result);
            console.log('Conversion successful');
          }
        });
      } catch (error) {
        console.error('Error handling PDF to DOCX conversion:', error);
      }

      return res.status(200).json({message:"test generated successfully",pdf:process.env.BACKEND_URL + pdfPath.replace(/(\.\/)?public/, ""),doc:process.env.BACKEND_URL + docPath.replace(/(\.\/)?public/, "")});
  });


  