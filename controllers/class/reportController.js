import { catchAsyncError } from "../../middleWares/catchAsyncError.js"; 
import { Report } from "../../models/Report.js";
import { Test } from "../../models/Test.js";
import { Question } from "../../models/Question.js";


export const getAllReports = catchAsyncError(async (req,res,next) => {
    let query = {
        teacher: req.params.teacherId
      };
    
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
            test: regex,
          },
          {
            student: regex,
          },
          {
            attempted: regex,
          },
          {
            grades: regex,
          },
          {
            status: regex,
          },
          {
            remark: regex,
          },
          {
            total: regex,
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
    
      const reports = await Report.aggregate(aggregateQuery);
    
      res.status(200).json({
        reports: reports[0].data,
        total: reports[0].metadata[0]
          ? Math.ceil(reports[0].metadata[0].total / limit)
          : 0,
        page,
        perPage: limit,
        search: search ? search : "",
      })
}) 

export const addReport = catchAsyncError(async (req,res,next) => {
    const {
        questions,
        remark,
    } = req.body;

    const testId = req.params.testId;

    const testFound = await Test.findById(testId)

    if(!testFound){
      return res.status(404).json({message:"test not found!"});
    }

    if (new Date() < testFound.startTime) {
      return res.status(400).json({message:"Test has not yet started."})
    } 
    if (new Date() > testFound.endTime) {
      return res.status(400).json({message:"Test has ended or the time is over. Contact admin for details."});
    }


  let obtainedMarks= 0;
  let total =0;
  let correct=0;
  let attempted=0;
  let incorrect=0;

  let _report = {
    student: req.user._id,
    teacher: testFound.creator,
    test:testId,
    questions:[],
  }

  for (const q of questions) {
    const questionId = q.questionId;
    const selectedOption = q.selected;

    const questionFound = await Question.findById(questionId);

    if (!questionFound) {
      return res.status(404).json({ message: "Question not found!" });
    }

    _report.questions.push({
      questionId,
      selectedOpt: selectedOption,
      correctOpt: questionFound.answer,
    });

    total += questionFound.marks;

     if (questionFound.answer === selectedOption) {
      obtainedMarks += questionFound.marks;
      correct++;
    } else {
      incorrect++;
    }

    questionFound.marks += total;
    attempted++;
  }

  let percentage = (obtainedMarks/total) * 100;

    _report = {
      ..._report,
      obtainedMarks,
      total,
      incorrect,
      correct,
      attempted,
      percentage,
    }

    if(remark){
      _report.remark=remark;
    }

  try {
    const report = await Report.create(_report);

    res.status(200).json(report);
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ message: "Internal server error" });
  }

}) 

export const getReportByTest = catchAsyncError(async (req,res,next) => {
  let query = {
    test: req.params.testId
  };

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
        test: regex,
      },
      {
        student: regex,
      },
      {
        attempted: regex,
      },
      {
        grades: regex,
      },
      {
        status: regex,
      },
      {
        remark: regex,
      },
      {
        total: regex,
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

  const reports = await Report.aggregate(aggregateQuery);

  res.status(200).json({
    reports: reports[0].data,
    total: reports[0].metadata[0]
      ? Math.ceil(reports[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  })
}) 

export const updateReport = catchAsyncError(async (req,res,next) => {

}) 

export const getReportByStudent = catchAsyncError(async (req,res,next) => {
  let query = {
    student: req.params.studentId
  };

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
        test: regex,
      },
      {
        student: regex,
      },
      {
        attempted: regex,
      },
      {
        grades: regex,
      },
      {
        status: regex,
      },
      {
        remark: regex,
      },
      {
        total: regex,
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

  const reports = await Report.aggregate(aggregateQuery);

  res.status(200).json({
    reports: reports[0].data,
    total: reports[0].metadata[0]
      ? Math.ceil(reports[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  })
}) 