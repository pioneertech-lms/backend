import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Report } from "../../models/Report.js";
import { Test } from "../../models/Test.js";
import { Question } from "../../models/Question.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;


export const getAllReports = catchAsyncError(async (req, res, next) => {
  let query = {
    teacher: new ObjectId(req.params.teacherId),
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
      $lookup: {
        from: "tests",
        let: { testId: "$test" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$testId"],
              },
            },
          },
          {
            $project: {
              // exam: 1,
              type: 1,
              subjects: 1,
            },
          },
        ],
        as: "test",
      },
    },
    {
      $match: {
      },
    },
    {
      $unwind: "$test",
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

  if (req.query.subjects) {
    let subjects = Array.isArray(req.query.subjects)
      ? req.query.subjects
      : [req.query.subjects];
    aggregateQuery[3].$match["test.subjects"] = { $in: subjects };
  }

  if (req.query.type) {
    let types = Array.isArray(req.query.type)
      ? req.query.type
      : [req.query.type];
    aggregateQuery[3].$match["test.type"] = { $in: types };
  }

  const reports = await Report.aggregate(aggregateQuery);

  res.status(200).json({
    reports: reports[0].data,
    total: reports[0].metadata[0]
      ? Math.ceil(reports[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  });
});


export const getSingleReport = catchAsyncError(async (req,res,next) => {
  const foundReport = await Report.findById(req.params.id);

  if(foundReport){
      return res.status(200).json(foundReport);
  } else {
      return res.status(404).json({message:"test not found!"});
  }
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
      selected: selectedOption,
      correct: questionFound.answer === selectedOption,
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
    student: new ObjectId(req.params.studentId)
  };

  let limit = parseInt(req.query.perPage) || 10;
  let page = req.query.page ? req.query.page : 1;
  let skip = (page - 1) * (req.query.perPage ? req.query.perPage : 10);
  let sort = req.query.sort ? {} : { createdAt: -1 };
  let search = req.query.search;
  let testId = req.query.testId;

  if(testId) {
    query.test = new ObjectId(testId);
  } else if (search) {
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
      $lookup: {
        from: "tests",
        let: { testId: "$test" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$testId"],
              },
            },
          },
          {
            $project: {
              // exam: 1,
              type: 1,
              subjects: 1,
            },
          },
        ],
        as: "test",
      },
    },
    {
      $match: {
      },
    },
    {
      $unwind: "$test",
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

  if (req.query.subjects) {
    let subjects = Array.isArray(req.query.subjects)
      ? req.query.subjects
      : [req.query.subjects];
    aggregateQuery[3].$match["test.subjects"] = { $in: subjects };
  }

  if (req.query.type) {
    let types = Array.isArray(req.query.type)
      ? req.query.type
      : [req.query.type];
    aggregateQuery[3].$match["test.type"] = { $in: types };
  }


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

export const getAnalysisReport = catchAsyncError(async (req,res,next) => {
  const {studentId} = req.params;
  const {
    subject,
    topic,
  } = req.query;

  const studentFound = await Report.find({student: new ObjectId(studentId) });

  if(!studentFound){
    return res.status(404).json({message:"student not found!"});
  }

  let analysisReport ={};

  const subjects = subject ? Array.isArray(subject) ? subject : [subject] : await Report.distinct("subject", {student: new ObjectId(studentId) });

  analysisReport.subjects = subjects;

  for (const subject of subjects) {
    if (subject && subject !== "") {
      const totalQuestions = await Report.countDocuments({ student: new ObjectId(studentId), subject });
      const correctAnswers = await Report.countDocuments({ student: new ObjectId(studentId), subject, isCorrect: true });
      const percentageCorrect = (correctAnswers / totalQuestions) * 100;

      const totalMarksObtained = await Report.aggregate([
        { $match: { student: new ObjectId(studentId), subject } },
        { $group: { _id: null, totalMarks: { $sum: "$marksObtained" } } }
      ]);

      const totalMarks = await Question.aggregate([
        { $match: { subject } },
        { $group: { _id: null, totalMarks: { $sum: "$marks" } } }
      ]);

      const topics = topic ? Array.isArray(topic) ? topic : [topic] : await Report.distinct("topic", { student: new ObjectId(studentId), subject });
      const topicAnalysis = [];

      for (const topic of topics) {
        if (topic && topic !== "") {
          const totalQuestionsByTopic = await Report.countDocuments({ student: new ObjectId(studentId), subject, topic });
          const correctAnswersByTopic = await Report.countDocuments({ student: new ObjectId(studentId), subject, topic, isCorrect: true });
          const percentageCorrectByTopic = (correctAnswersByTopic / totalQuestionsByTopic) * 100;

          topicAnalysis.push({
            topic,
            totalQuestions: totalQuestionsByTopic,
            correctAnswers: correctAnswersByTopic,
            percentageCorrect: percentageCorrectByTopic
          });
        }
      }

      analysisReport[subject] = {
        totalQuestions,
        correctAnswers,
        percentageCorrect,
        totalMarksObtained: totalMarksObtained[0]?.totalMarks || 0,
        totalMarks: totalMarks[0]?.totalMarks || 0,
        topicAnalysis
      };
    }
  }

  const overalPerformance = {
    totalQuestions: await Report.countDocuments({ student: new ObjectId(studentId) }),
    correctAnswers: await Report.countDocuments({ student: new ObjectId(studentId), isCorrect: true }),
    totalMarksObtained: await Report.aggregate([
      { $match: { student: new ObjectId(studentId) } },
      { $group: { _id: null, totalMarks: { $sum: "$marksObtained" } } }
    ]),
    totalMarks: await Question.aggregate([
      { $group: { _id: null, totalMarks: { $sum: "$marks" } } }
    ])
  };

  analysisReport.overalPerformance = overalPerformance;

  res.status(200).json(analysisReport);
});
