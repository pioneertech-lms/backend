import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Test } from "../../models/Test.js";
import { Question } from "../../models/Question.js";
import ejs from "ejs";
import dayjs from "dayjs";


export const getAllTeacherTests = catchAsyncError(async (req, res, next) => {
  let query = {
    creator: req.user._id,
  };

  if (req.query.isDeleted === "true") {
    query.isActive = true;
  }

  if (req.query.type) {
    const types = Array.isArray(req.query.type)
      ? req.query.type
      : [req.query.type];

    query.type = {
      $in: types,
    };
  }
  if (req.query.exam) {
    const exams = Array.isArray(req.query.exam)
      ? req.query.exam
      : [req.query.exam];

    query.exam = {
      $in: exams,
    };
  }
  if (req.query.subjects) {
    const subjects = Array.isArray(req.query.subjects)
      ? req.query.subjects
      : [req.query.subjects];

    query.subjects = {
      $in: subjects,
    };
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
      $facet: {
        upcomingTests: [
          {
            $match: {
              endTime: { $gt: new Date() },
            },
          },
        ],
        finishedTests: [
          {
            $match: {
              endTime: { $lt: new Date() },
            },
          },
          {
            $sort: sort,
          },
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
    upcomingTests: tests[0].upcomingTests,
    finishedTests: tests[0].finishedTests,
    total: tests[0].metadata[0]
      ? Math.ceil(tests[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  });
});


export const getAllStudentTests = catchAsyncError(async (req, res, next) => {
  let query = {
    $or: [
      { creator: req.user.createdBy },
      { creator: req.user._id },
    ]
  };

  if (req.query.type) {
    const types = Array.isArray(req.query.type)
      ? req.query.type
      : [req.query.type];

    query.type = {
      $in: types,
    };
  }
  if (req.query.exam) {
    const exams = Array.isArray(req.query.exam)
      ? req.query.exam
      : [req.query.exam];

    query.exam = {
      $in: exams,
    };
  }
  if (req.query.subjects) {
    const subjects = Array.isArray(req.query.subjects)
      ? req.query.subjects
      : [req.query.subjects];

    query.subjects = {
      $in: subjects,
    };
  }

  if (req.query.isDeleted === "true") {
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
        upcomingTests: [
          {
            $match: {
              endTime: { $gt: new Date() },
            },
          },
        ],
        finishedTests: [
          {
            $match: {
              endTime: { $lt: new Date() },
            },
          },
          {
            $sort: sort,
          },
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
    upcomingTests: tests[0].upcomingTests,
    finishedTests: tests[0].finishedTests,
    total: tests[0].metadata[0]
      ? Math.ceil(tests[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  });
});

export const getRandomQuestions = catchAsyncError(async (req, res, next) => {
  const selectedQuestions = [];
  const { questions, total, type, exam } = req.body;

  if (!questions || !total) {
    return res.status(500).json({ message: "pass questions and total!" });
  }

  // get last 5 random tests
  const previousTests = await Test.find({
    creator: type === "random" ? req.user._id : req.user.createdBy,
    exam,
    type: { $in: ['random', 'mock', 'scheduled'] }
  })
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

  for (let { topic, noOfQue } of questions) {
    const baseQuery = {
      topic: topic,
      $or: [
        { isCommon: true },
        { isCommon: false },
        {
          creator: type === "random" ? req.user._id : req.user.createdBy
        }
      ],
      $and: [{ exam }]
    };

    if (req.user.subjects && req.user.subjects.length > 0) {
      baseQuery.subject = { $in: req.user.subjects };
    }
    if (req.user.exams && req.user.exams.length > 0) {
      baseQuery.exam = { $in: req.user.exams };
    }

    let uniqueQuestions = await Question.aggregate([
      {
        $match: {
          ...baseQuery,
          _id: { $nin: Array.from(usedQuestionIds) }
        }
      },
      {
        $sample: { size: noOfQue }
      }
    ]);

    if (uniqueQuestions.length < noOfQue) {
      let deficit = noOfQue - uniqueQuestions.length;
      let additionalQuestions = await Question.aggregate([
        {
          $match: {
            ...baseQuery,
            _id: { $nin: Array.from(uniqueQuestions.map(q => q._id)) }
          }
        },
        {
          $sample: { size: deficit }
        }
      ]);

      uniqueQuestions = uniqueQuestions.concat(additionalQuestions);
    }

    selectedQuestions.push(...uniqueQuestions);
  }

  if (selectedQuestions.length < total) {
    return res.status(501).json({ message: "Insufficient questions in database to create test" });
  }

  return res.status(200).json({ message: "OK", questions: selectedQuestions });
})

export const createTest = catchAsyncError(async (req, res, next) => {
  const {
    name,
    type,
    duration,
    subjects,
    questions,
    startTime,
    endTime,
    exam,
  } = req.body;

  if (!type) {
    return res.status(500).json({ message: "invalid test type!" });
  }

  const foundName = await Test.findOne({ name });

  if (foundName) {
    return res.status(501).json({ message: "test with same name exist!" });
  }

  let _test = {
    name,
    type,
    creator: req.user._id,
  }
  if (duration) {
    _test.duration = duration;
  }
  if (subjects) {
    _test.subjects = subjects;
  }
  if (exam) {
    _test.exam = exam;
  }
  if (startTime) {
    _test.startTime = new Date(startTime);
  }
  if (endTime) {
    _test.endTime = new Date(endTime);
  }

  if (_test.type === "manual" || _test.type === "random" || _test.type === "mock" || _test.type === "scheduled") {
    _test.questions = questions;
  }
  if (_test.type === "live") {

  }

  console.log(_test);
  const createTest = await Test.create(_test);

  if (createTest) {
    return res.status(200).json({ message: "test created successfully", id: createTest._id });
  } else {
    return res.status(501).json({ message: "error creating test" });
  }

});

export const deleteTest = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const result = await Test.deleteOne({ _id: id });

  if (result.deletedCount > 0) {
    return res.status(200).json({ message: "Test deleted successfully" });
  } else {
    return res.status(404).json({ message: "Test not found" });
  }
});

export const getSingleTest = catchAsyncError(async (req, res, next) => {

  const foundTest = await Test.findById(req.params.id);

  if (foundTest) {
    return res.status(200).json(foundTest);
  } else {
    return res.status(404).json({ message: "test not found!" });
  }
});

export const updateTest = catchAsyncError(async (req, res, next) => {
  const {
    name,
    type,
    subjects,
    questions,
    duration,
    startTime,
    endTime,
    exam,
  } = req.body;

  const test = await Test.findById(req.params.id);

  if (!test) {
    return res.status(404).json({ message: "test not found" });
  }

  if (name) {
    test.name = name;
  }
  if (type) {
    test.type = type;
  }
  if (exam) {
    test.exam = exam;
  }
  if (subjects) {
    test.subjects = subjects;
  }
  if (questions) {
    test.questions = questions;
  }
  if (duration) {
    test.duration = duration;
  }
  if (startTime) {
    test.startTime = startTime;
  }
  if (endTime) {
    test.endTime = endTime;
  }

  try {
    await test.save();
    return res.status(200).json({ message: "test updated successfully" });
  } catch (error) {
    return res.status(501).json({ message: "something went wrong", error: error.message });
  }
});

export const printTest = catchAsyncError(async (req, res, next) => {
  const trimHtml = html => html.replace(/^\s+$/gm, "").replace("&nbsp;", "").replace(/\<br(\s\/)?\>/gm, "");

  const type = req.query.type;
  const id = req.params.id;

  const testFound = await Test.findById(id)
    .populate('questions')
    .populate('creator');

  let layout = 'one-column'

  if (req.query.layout) {
    layout = req.query.layout
  }

  const questions = testFound.questions.map(q => {
    q.question = trimHtml(q.question)
    // q.explanation = trimHtml(q.explanation)
    q.options = q.options.map(trimHtml)
  });

  const startTime = new Date(testFound.startTime);
  const endTime = new Date(testFound.endTime);
  const durationInMinutes = (endTime - startTime) / (1000 * 60);

  const templatePaths = {
    paper: 'views/test/paper.ejs',
    answers: 'views/test/answersheet.ejs',
    paperWithAnswers: 'views/test/paperwithanswers.ejs'
  };

  const htmlContent = await ejs.renderFile(templatePaths[type], {
    layout,
    test: testFound,
    duration: dayjs(endTime).diff(startTime, "minutes"),
    date: dayjs(startTime).format("DD/MM/YYYY"),
  });

  try {
    const browser = req.app.get("browser");
    const page = await browser.newPage(); // Single page instance
    await page.goto("about:blank");
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { left: '0.5cm', top: '1cm', right: '0.5cm', bottom: '1cm' } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${testFound.name}.pdf`);
    res.send(pdfBuffer);

    await page.close();
  } catch (err) {
    res.status(500).send("Could not generate PDF!");
  }
})
