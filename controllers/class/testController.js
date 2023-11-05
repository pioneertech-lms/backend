import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import {Test} from "../../models/Test.js";

export const getAllTests = catchAsyncError(async (req,res,next) => {
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

    const foundName = await Test.findOne({name});

    if(foundName){
        return res.status(501).json({message:"test with same name exist!"});
    }

    let _test = {
        name,
        type,
    }
    if(duration){
     _test.duration= duration ;  
    }
    if(subjects){
     _test.subjects= subjects;   
    }
    if(startTime){
     _test.startTime= startTime;   
    }
    if(endTime){
     _test.endTime= endTime;   
    }
    
    if(_test === "random"){
      if(req.body.topics && req.body.topics.length !=0){
        let query = {
          isDeleted:false,
        }
        let aggregateQuery = [
          {
            $match: query,
          },
          {
            $sample: { size: noOfQues }
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
      
        const questions = await Test.aggregate(aggregateQuery);
      
        
      }
    }
    if(_test === "manual"){
        _test.questions = questions;
    }
    if(_test === "live"){
        
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