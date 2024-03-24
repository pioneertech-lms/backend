import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Report } from "../../models/Report.js";
import { Test } from "../../models/Test.js";
import { User } from "../../models/User.js";
import { Question } from "../../models/Question.js";
import mongoose from "mongoose";
import ejs from "ejs";
import dayjs from "dayjs";

const ObjectId = mongoose.Types.ObjectId;

export const getAllReports = catchAsyncError(async (req, res) => {
  const teacherId = new ObjectId(req.params.teacherId);
  const exam = req.query.exam;
  const limit = parseInt(req.query.perPage) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const sort = req.query.sort ? {} : { createdAt: -1 };
  const search = req.query.search;

  const query = {
    teacher: teacherId,
  };

  const aggregateQuery = [
    { $match: query },
    { $sort: sort },
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
              exam
            },
          },
          {
            $project: {
              type: 1,
              name: 1,
              subjects: 1,
            },
          },
        ],
        as: "test",
      },
    },
    { $unwind: "$test" },
    {
      $lookup: {
        from: "users",
        localField: "student",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $addFields: {
        "student.fullName": {
          $concat: ["$student.firstName", " ", "$student.lastName"],
        },
      },
    },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
        ],
        metadata: [
          { $match: query },
          { $count: "total" },
        ],
      },
    },
  ];

  const reports = await Report.aggregate(aggregateQuery);

  const allReports = await Report.find(query)
    .sort(sort)
    .populate({
      path: "test",
      select: "type name subjects",
    })
    .populate({
      path: "student",
      select: "firstName lastName username",
    })
    .skip(skip)
    .limit(limit);

  console.log("All Reports:", allReports);

  if (search) {
    const newSearchQuery = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(newSearchQuery, "gi");

    const filteredReports = allReports.filter((report) => {
      return (
        report?.test?.name?.match(regex) ||
        report?.student?.firstName?.match(regex) ||
        report?.student?.lastName?.match(regex) ||
        report?.student?.username?.match(regex) ||
        report?.status?.match(regex) ||
        report?.remark?.match(regex) ||
        report?.total?.toString().match(regex)
      );
    });

    const totalFilteredReports = filteredReports.length;

    res.status(200).json({
      reports: filteredReports,
      total: Math.ceil(totalFilteredReports / limit),
      page,
      perPage: limit,
      search,
    });
  } else {
    const totalReports = reports[0].metadata[0] ? reports[0].metadata[0].total : 0;

    res.status(200).json({
      reports: reports[0].data,
      total: Math.ceil(totalReports / limit),
      page,
      perPage: limit,
      search,
    });
  }
});

export const getSingleReport = catchAsyncError(async (req, res, next) => {
  const foundReport = await Report.findById(req.params.id);

  if (foundReport) {
    return res.status(200).json(foundReport);
  } else {
    return res.status(404).json({ message: "test not found!" });
  }
})

export const addReport = catchAsyncError(async (req, res, next) => {
  const {
    questions,
    remark,
  } = req.body;

  const testId = req.params.testId;

  const testFound = await Test.findById(testId)

  if (!testFound) {
    return res.status(404).json({ message: "test not found!" });
  }

  if (new Date() < testFound.startTime) {
    return res.status(400).json({ message: "Test has not yet started." })
  }
  if (new Date() > testFound.endTime) {
    return res.status(400).json({ message: "Test has ended or the time is over. Contact admin for details." });
  }


  let obtainedMarks = 0;
  let total = 0;
  let correct = 0;
  let attempted = 0;
  let incorrect = 0;

  let _report = {
    student: req.user._id,
    teacher: testFound.creator,
    test: testId,
    questions: [],
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

  let percentage = (obtainedMarks / total) * 100;

  _report = {
    ..._report,
    obtainedMarks,
    total,
    incorrect,
    correct,
    attempted,
    percentage,
  }

  if (remark) {
    _report.remark = remark;
  }

  try {
    const report = await Report.create(_report);

    res.status(200).json(report);
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ message: "Internal server error" });
  }

})

export const getReportByTest = catchAsyncError(async (req, res, next) => {
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

export const updateReport = catchAsyncError(async (req, res, next) => {

})

export const getReportByStudent = catchAsyncError(async (req, res, next) => {
  let query = {
    student: new ObjectId(req.params.studentId)
  };

  let limit = parseInt(req.query.perPage) || 10;
  let page = req.query.page ? req.query.page : 1;
  let skip = (page - 1) * (req.query.perPage ? req.query.perPage : 10);
  let sort = req.query.sort ? {} : { createdAt: -1 };
  let search = req.query.search;
  let testId = req.query.testId;
  let exam = req.query.exam;

  if (testId) {
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
              exam
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

  // if(req.query.exam) {
  //   aggregateQuery[3].$match["exam"] = req.query.exam;
  // }

  if (req.query.exam && req.query.exam !== "") {
    const matchStage = {
      $match: {
        exam: req.query.exam,
      },
    };

    aggregateQuery[2].$lookup.pipeline.splice(1, 0, matchStage);
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

export const getAnalysisReport = catchAsyncError(async (req, res, next) => {
  const { studentId } = req.params;
  const {
    subject,
    topic,
  } = req.query;

  const studentFound = await Report.find({ student: new ObjectId(studentId) });

  if (!studentFound) {
    return res.status(404).json({ message: "student not found!" });
  }

  let analysisReport = {};

  const subjects = subject ? Array.isArray(subject) ? subject : [subject] : await Report.distinct("subject", { student: new ObjectId(studentId) });

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

export const getTestReportForAllStudents = catchAsyncError(async (req, res, next) => {
  const { testId } = req.params;
  const test = await Test.findById(testId);

  if (!test) {
    return res.status(404).json({ message: "test not found!" });
  }

  const creator = await User.findById(test.creator);
  const students = await User.find({
    createdBy: test.creator
  })

  const entries = await Promise.all(students.map(async student => {
    const report = await Report.findOne({
      student: student._id,
      $and: [
        {
          test: test._id,
        }
      ]
    })

    return {
      student,
      percentage: report ? (report.obtainedMarks * 100 / report.total) : undefined,
      present: report ? true : false
    }
  }))

  const htmlContent = await ejs.renderFile("views/report/test.ejs", {
    dayjs,
    test,
    entries,
    user: creator
  })

  try {
    const browser = req.app.get("browser");
    const page = await browser.newPage(); // Single page instance
    await page.goto("about:blank");
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${test.name}-report.pdf`);
    res.send(pdfBuffer);

    await page.close();
  } catch (err) {
    res.status(500).send("Could not generate PDF!");
  }

})

export const getStudentReportForAllTests = catchAsyncError(async (req, res, next) => {
  const { studentId } = req.params;
  const user = await User.findById(studentId).populate("createdBy");

  if (!user || user.role !== "student") {
    return res.status(404).json({ message: "student not found!" });
  }

  const entries = await Test.aggregate([
    {
      $match: {
        $or: [
          { creator: user.createdBy._id },
          { creator: user._id },
        ]
      }
    },
    {
      $lookup: {
        from: "reports",
        localField: "_id",
        foreignField: "test",
        as: "report"
      }
    },
    {
      $addFields: {
        percentage: {
          $cond: [
            {
              $and: [
                { $gt: [{ $size: "$report" }, 0] },
                { $ne: [{ $arrayElemAt: ["$report.total", 0] }, 0] } // Check if total is not zero
              ]
            },
            {
              $multiply: [
                { $divide: [{ $arrayElemAt: ["$report.obtainedMarks", 0] }, { $arrayElemAt: ["$report.total", 0] }] },
                100
              ]
            },
            undefined
          ]
        }
      }
    },
    {
      $project: {
        report: 0,
        questions: 0
      }
    }
  ]);

  const htmlContent = await ejs.renderFile("views/report/student.ejs", {
    dayjs,
    user,
    entries
  })

  try {
    const browser = req.app.get("browser");
    const page = await browser.newPage(); // Single page instance
    await page.goto("about:blank");
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { left: '0.5cm', top: '0.5cm', right: '0.5cm', bottom: '0.5cm' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${user.firstName}-${user.lastName}-report.pdf`);
    res.send(pdfBuffer);

    await page.close();
  } catch (err) {
    res.status(500).send("Could not generate PDF!");
  }

})
