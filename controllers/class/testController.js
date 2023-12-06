import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import {Test} from "../../models/Test.js";
import { Question } from "../../models/Question.js";
import {ensureDirExists} from "../../utils/files.js";
import axios from 'axios';
import htmlDocx from 'html-docx-js';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

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
        const baseQuery = {
          isDeleted: false,
          creator: req.user._id,
          topic: topic,
        };
        if (req.user.subjects && req.user.subjects.length > 0) {
          baseQuery.subject = { $in: req.user.subjects };
        }
        if (req.user.exams && req.user.exams.length > 0) {
          baseQuery.exams = { $in: req.user.exams };
        }

        let uniqueQuestions = await Question.find({
            ...baseQuery,
            _id: { $nin: Array.from(usedQuestionIds) }
        }).select('_id').limit(noOfQue);

        if (uniqueQuestions.length < noOfQue) {
            let deficit = noOfQue - uniqueQuestions.length;
            let additionalQuestions = await Question.find({
                ...baseQuery,
                _id: { $nin: Array.from(uniqueQuestions.map(q => q._id)) }
            }).select('_id').limit(deficit);

            uniqueQuestions = uniqueQuestions.concat(additionalQuestions);
        }

        _test.questions.push(...uniqueQuestions.map(q => q._id));
    }

    if(_test.questions.length < total) {
      return res.status(501).json({message: "Insufficient questions in database to create test"});
    }

    }
    if(_test.type === "manual"){
        _test.questions = questions;
    }
    if(_test.type === "live"){

    }

    console.log(_test);
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

    const startTime = new Date(testFound.startTime);
    const endTime = new Date(testFound.endTime);
    const durationInMinutes = (endTime - startTime) / (1000 * 60);
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = Math.floor(durationInMinutes % 60);

    const questionsHtml = questions.map((question, i) => `
      <div class="question">
          <p>${i + 1}. ${question.question}</p>
          <ol class="options" type="A">
              ${question.options.map((option, index) => `<li>${option}</li>`).join('')}
          </ol>
      </div>
  `).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quiz Paper</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8" crossorigin="anonymous"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" integrity="sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05" crossorigin="anonymous"></script>
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                renderMathInElement(document.body, {
                  delimiters: [
                      {left: '$$', right: '$$', display: true},
                      {left: '$', right: '$', display: false},
                      {left: '\\(', right: '\\)', display: false},
                      {left: '\\[', right: '\\]', display: true}
                  ],
                  throwOnError : false
                });
            });
        </script>
        <!-- <link rel="stylesheet" href="styles.css">  -->
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }

            .header {
                text-align: center;
                padding: 20px;
                background-color: #f2f2f2;
                border-bottom: 1px solid #ddd;
            }

            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.2;
            }

            .question {
                margin: 20px;
            }

            .options {
                margin-left: 10px;
            }

            #questions-container {
                column-count: 2;
            }
        </style>
    </head>
    <body>

    <div class="header">
        <img id="logo" src="${testFound.creator.logoImg ? testFound.creator.logoImg : ""}" alt="Logo" height="50">
        <h1 id="test-name">${testFound.name ? testFound.name : ""}</h1>
        <p>Duration: <span id="duration">${hours}:${minutes}hrs</span> | Subjects: <span id="subjects">${testFound.subjects.join(', ')}</span></p>
    </div>

    <div class="watermark">
        <img id="watermark" src="${testFound.creator.watermarkImg ? testFound.creator.watermarkImg : ""}" alt="watermark" height="100">
    </div>

    <div id="questions-container">
        ${questionsHtml}
    </div>

    </body>
    </html>
    `

      // (async () => {
        const browser = await puppeteer.launch({ headless: true});
        const page = await browser.newPage();

        // await page.goto(process.env.BACKEND_URL +'/templates/test_template.html');

      await page.setContent(htmlContent, { waitUntil: "networkidle0" })

      let pdfPath;
      let docPath;

      try {
        // Generate PDF with watermark
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        const wordBuffer = htmlDocx.asBlob(await page.content());

        // Convert Blob to Buffer
        const wordArrayBuffer = await new Response(wordBuffer).arrayBuffer();
        const docxBuffer = Buffer.from(wordArrayBuffer);

        // Upload the files to S3
        let formData1 = new FormData();
        formData1.append('testPaper', new Blob([pdfBuffer]), 'questionPaper.pdf');
        const response1 = await axios.post(`${process.env.BACKEND_URL}/api/utils/uploads`, formData1);

        let formData2 = new FormData();
        formData2.append('testPaper',  new Blob([docxBuffer]), 'questionPaper.docx');
        const response2 = await axios.post(`${process.env.BACKEND_URL}/api/utils/uploads`, formData2);

        pdfPath = response1.data.assets[0];
        docPath = response2.data.assets[0];
      } catch (error) {
        console.error('Error in the main code block:', error.message);
      } finally {
        await browser.close();
        // console.log({pdfPath,docPath})
        return res.status(200).json({message:"test generated successfully",pdf:pdfPath,doc:docPath});
      }
      // converting to docx
      // try {
      //   const tempDir = path.dirname(pdfPath);
      //   fs.mkdirSync(tempDir, { recursive: true });

      //   const input = fs.readFileSync(pdfPath);

      //   libre.convert(input, '.docx', undefined, (err, result) => {
      //     if (err) {
      //       console.error(`Error converting PDF to DOCX: ${err}`);
      //     } else {
      //       fs.writeFileSync(docPath, result);
      //       console.log('Conversion successful');
      //     }
      //   });
      // } catch (error) {
      //   console.error('Error handling PDF to DOCX conversion:', error);
      // }

  });


