import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Report } from "../../models/Report.js";
import { Test } from "../../models/Test.js";
import { User } from "../../models/User.js";
import { Question } from "../../models/Question.js";
import mongoose from "mongoose";

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
  let exam = req.query.exam;

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

// export const getOverallReports = async (req, res, next) => {
//   const teacherId = new ObjectId(req.params.id);

//   if (!teacherId) {
//     return res.status(404).json({ message: "teacher not found!" });
//   } else {
//     const teacherFound = await User.findById(teacherId);

//     if (!teacherFound) {
//       return res.status(404).json({ message: "teacher not found!" });
//     }
//   }

//   const limit = parseInt(req.query.perPage) || 10;
//   const page = parseInt(req.query.page) || 1;
//   const skip = (page - 1) * limit;
//   const sort = req.query.sort ? {} : { createdAt: -1 };
//   const search = req.query.search;

//   const query = {
//     // teacher: teacherId,
//     "student.role": "student",
//     createdBy: teacherId
//   };

//   if (req.query.exam) {
//     query.exam = req.query.exam;
//   }

//   const aggregateQuery = [
//     { $match: query },
//     { $sort: sort },
//     {
//       $lookup: {
//         from: "tests",
//         let: { testId: "$test" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $eq: ["$_id", "$$testId"],
//               },
//             },
//           },
//           {
//             $project: {
//               type: 1,
//               name: 1,
//               subjects: 1,
//             },
//           },
//         ],
//         as: "test",
//       },
//     },
//     { $unwind: "$test" },
//     {
//       $lookup: {
//         from: "users",
//         localField: "student",
//         foreignField: "_id",
//         as: "student",
//       },
//     },
//     { $unwind: "$student" },
//     {
//       $addFields: {
//         "student.fullName": {
//           $concat: ["$student.firstName", " ", "$student.lastName"],
//         },
//       },
//     },
//     {
//       $facet: {
//         data: [
//           { $skip: skip },
//           { $limit: limit },
//         ],
//         metadata: [
//           { $match: query },
//           { $count: "total" },
//         ],
//       },
//     },
//   ];

//   const reports = await Report.aggregate(aggregateQuery);

//   const allReports = await Report.find(query)
//     .sort(sort)
//     .populate({
//       path: "test",
//       select: "type name subjects",
//     })
//     .populate({
//       path: "student",
//       select: "firstName lastName username",
//     })
//     .skip(skip)
//     .limit(limit);

//   if (search) {
//     const newSearchQuery = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
//     const regex = new RegExp(newSearchQuery, "gi");

//     const filteredReports = allReports.filter((report) => {
//       return (
//         report?.test?.name?.match(regex) ||
//         report?.student?.firstName?.match(regex) ||
//         report?.student?.lastName?.match(regex) ||
//         report?.student?.username?.match(regex) ||
//         report?.status?.match(regex) ||
//         report?.remark?.match(regex) ||
//         report?.total?.toString().match(regex)
//       );
//     });

//     const totalFilteredReports = filteredReports.length;

//     res.status(200).json({
//       reports: filteredReports.map((report, index) => ({
//         serialNo: skip + index + 1,
//         studentName: report.student.fullName,
//         testName: report.test.name,
//         date: report.createdAt,
//         subjects: report.test.subjects,
//         exam: report.exam,
//         percentage: report.percentage,
//         attendance: report.attendance ? "Present" : "Absent",
//       })),
//       total: Math.ceil(totalFilteredReports / limit),
//       page,
//       perPage: limit,
//       search,
//     });
//   } else {
//     const totalReports = reports[0].metadata[0] ? reports[0].metadata[0].total : 0;

//     res.status(200).json({
//       reports: reports[0].data.map((report, index) => ({
//         serialNo: skip + index + 1,
//         studentName: report.student.fullName,
//         testName: report.test.name,
//         date: report.createdAt,
//         subjects: report.test.subjects,
//         exam: report.exam,
//         percentage: report.percentage,
//         attendance: report.attendance ? "Present" : "Absent",
//       })),
//       total: Math.ceil(totalReports / limit),
//       page,
//       perPage: limit,
//       search,
//     });
//   }
// }

  export const getOverallReports = async (req, res, next) => {
      const id = req.params.id;
      const teacherId =new ObjectId(id); 

      if (!id) {
        return res.status(404).json({ message: "teacher not found!" });
      } else {
        const teacherFound = await User.findById(teacherId);
        if (!teacherFound) {
          return res.status(404).json({ message: "teacher not found!" });
        }
      }

      const limit = parseInt(req.query.perPage) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const sort = req.query.sort ? {} : { createdAt: -1 };
      const search = req.query.search;
      const query = {
        teacher: teacherId
      };

      if (req.query.exam) {
        query.exam = req.query.exam;
      }

      if (search) {
        query.$or = [
          { "student.fullName": { $regex: search, $options: "i" } },
          { "test.name": { $regex: search, $options: "i" } },
          { "student.username": { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { remark: { $regex: search, $options: "i" } },
          { total: { $regex: search, $options: "i" } }
        ];
      }

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

      res.status(200).json({
        reports: reports[0].data.map((report, index) => ({
          serialNo: skip + index + 1,
          studentName: report.student.fullName,
          testName: report.test.name,
          date: report.createdAt,
          subjects: report.test.subjects,
          exam: report.exam,
          percentage: (report.correct / report.attempted) * 100,
          attendance: "Present",
        })),
        total: reports[0].metadata[0] ? Math.ceil(reports[0].metadata[0].total / limit) : 0,
        page,
        perPage: limit,
        search: search ? search : "",
      });
  }

  import ejs from "ejs";
  import path from "path";
  import fs from "fs";
  
  export const printOverallStudentReports = async (req, res, next) => {
    try {
      const userId  = req.params.id;
      const user = await User.findById(new ObjectId(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found!" });
      }
  
      const reports = await Report.find({ student: userId })
        .populate("test")
        .populate("student");
  
      const data = reports.map((report, index) => ({
        serialNo: index + 1,
        testName: report.test.name,
        testType: report.test.type,
        date: formatDate(report.createdAt),
        result: {
          totalMarks: report.obtainedMarks,
          percentage: ((report.obtainedMarks / report.total) * 100).toFixed(2),
          attemptedPercentage: ((report.attempted / report.total) * 100).toFixed(2),
          accuracyPercentage: (((report.correct / report.attempted) * 100) || 0).toFixed(2),
        },
      }));
  
      const templatePath = path.resolve(__dirname, "../../views/report/overallStudentReports.ejs");
      const templateString = fs.readFileSync(templatePath, "utf8");
      const renderedHtml = ejs.render(templateString, { user: user.fullName, reports: data });
  
      res.send(renderedHtml);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  function formatDate(date) {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString("en-US", options).replace(/\//g, "-");
  }
  

export const getOverallReportsByStudent = async (req, res, next) => {
  try {
    const {studentId} = req.params;
    const { subject, topic, exam, type, page = 1, perPage = 10, search, sort } = req.query;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found!" });
    }

    const query = { student: new ObjectId(studentId) };

    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (exam) query.exam = exam;
    if (type) query["test.type"] = type;

    const limit = parseInt(perPage);
    const skip = (parseInt(page) - 1) * limit;
    const sortQuery = sort ? { [sort]: 1 } : { createdAt: -1 };

    const searchQuery = search ? {
      $or: [
        { "student.fullName": { $regex: search, $options: "i" } },
        { "test.name": { $regex: search, $options: "i" } },
        { "test.type": { $regex: search, $options: "i" } },
        { exam: { $regex: search, $options: "i" } },
      ],
    } : {};

    const reports = await Report.find({ ...query, ...searchQuery })
      .sort(sortQuery)
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

    const totalReports = await Report.countDocuments({ ...query, ...searchQuery });

    const formattedReports = reports.map((report, index) => ({
      serialNo: skip + index + 1,
      studentName: report.student.fullName,
      testName: report.test.name,
      testType: report.test.type,
      date: report.createdAt.toLocaleDateString("en-GB"),
      subjects: report.test.subjects,
      exam: report.exam,
      percentage: parseFloat(((report.correct / report.attempted) * 100).toFixed(2)),
      attendance: "Present",
    }));

    const totalPages = Math.ceil(totalReports / limit);

    res.status(200).json({
      reports: formattedReports,
      total: totalPages,
      page: parseInt(page),
      perPage: limit,
      search: search || "",
    });
  } catch (error) {
    next(error);
  }
}
