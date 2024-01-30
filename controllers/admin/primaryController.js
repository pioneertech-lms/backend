import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { Class } from "../../models/Class.js";
import { User } from "../../models/User.js";
import { Question } from "../../models/Question.js";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role !== "teacher") {
    // Delete the user
    const result = await User.deleteOne({ _id: id });

    if (result.deletedCount > 0) {
      return res.status(200).json({ message: "User deleted successfully" });
    } else {
      return res.status(500).json({ message: "Failed to delete user" });
    }
  } else {
    // Delete the teacher
    const result = await User.deleteOne({ _id: id });

    if (result.deletedCount > 0) {
      // Mark all students of the teacher as inactive
      await User.updateMany({ createdBy: id, role: "student" }, { isActive: true });

      return res.status(200).json({ message: "Teacher deleted successfully" });
      // return res.status(200).json({ message: "Teacher and associated students deleted successfully" });
    } else {
      return res.status(500).json({ message: "Failed to delete teacher" });
    }
  }
});

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  let query = {
    isDeleted: false,
  };


  if(req.query.teacherId){
    query.createdBy = new ObjectId(req.query.teacherId);
    query.role = "student";
  }

  if(req.query.role){
    query.role = req.query.role;
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
        firstName: regex,
      },
      {
        lastName: regex,
      },
      {
        username: regex,
      },
      {
        email: regex,
      },
      {
        phone: regex,
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

  const users = await User.aggregate(aggregateQuery);

  res.status(200).json({
    users: users[0].data,
    total: users[0].metadata[0]
      ? Math.ceil(users[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  })
});

export const getSingleUser = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(user){
        return res.status(200).json(user);
    } else {
        return res.status(404).json({message:"User not found"});
    }
});

export const updateUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if(!user){
    return res.status(404).json({message:"User not found!"});
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    username,
    role,
    address,
    city,
    state,
    pincode,
    dob,
    gender,
    description,
    isActive,
    isVerified,
    isDeleted,
    modules,
    exams,
    subjects,
  } = req.body;

  if(firstName){
    user.firstName = firstName;
  }
  if(lastName){
    user.lastName = lastName;
  }
  if(username){
    user.username = username;
  }
  if(isActive){
    user.isActive = isActive == 'true' ? true : false;
  }
  if(isVerified){
    user.isVerified = isVerified == 'true' ? true : false;
  }
  if(isDeleted){
    user.isDeleted = isDeleted== 'true'? true:false;
  }
  if(modules){
    user.modules = modules;
  }
  if(subjects){
    user.subjects = subjects;
  }
  if(exams){
    user.exams = exams;
  }
  if(role){
    user.role = role;
  }
  if(email){
    user.email = email;
  }
  if(phone){
    user.phone = phone;
  }
  if(dob){
    user.dob = dob;
  }
  if(role){
    user.role = role;
  }
  if(gender){
    user.gender = gender;
  }
  if(description){
    user.description = description;
  }


  if(address || city || state || pincode){
    let _location = {};

      if(address){
    _location.address = address;
    }
    if(city){
      _location.city = city;
    }
    if(state){
      _location.state = state;
    }
    if(pincode){
      _location.pincode = pincode;
    }

    user.location = _location
  }

  const result = await user.save();

  if(result){
    return res.status(200).json({message:"User updated successfully."});
  } else {
    return res.status(502).json({message:"Something went wrong!"});
  }
});

export const userChangePassword = catchAsyncError(async (req, res, next) => {

    const user = await User.findById(req.params.id).select(
        "+password"
      );

    if(!user){
        return res.status(404).json({message:"User not found!"});
    } else {
        user.password = req.body.password;
        await user.save();

        return res.status(200).json({message:"Password updated successfully"});
    }
});


// class routes
export const getAllClasses = catchAsyncError(async (req,res,next) => {
  let query = {
    isDeleted: false,
    isVerified:true,
    isActive:true,
  };

  if(req.query.role){
    query.role = req.query.role;
  }

  if(req.query.isDeleted=== "true"){
    query.isActive = true;
  }
  if(req.query.isVerified === "false"){
    query.isVerified = false;
  }
  if(req.query.isActive==="false"){
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
        className: regex,
      },
      {
        description: regex,
      },
      {
        location: regex,
      },
      {
        supportEmail: regex,
      },
      {
        supportPhone: regex,
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

  const classes = await Class.aggregate(aggregateQuery);

  res.status(200).json({
    classes: classes[0].data,
    total: classes[0].metadata[0]
      ? Math.ceil(classes[0].metadata[0].total / limit)
      : 0,
    page,
    perPage: limit,
    search: search ? search : "",
  })
})

export const createClass = catchAsyncError(async (req,res,next) => {

  const {
    className,
    description,
    adminUsername,
    adminPassword,
    supportEmail,
    supportPhone,
    address,
    city,
    state,
    pincode,
  } = req.body;

  const classFound = await Class.findOne({className});

  if(classFound){
    return res.status(502).json({message:"Class with this classname already exists!"});
  }

  const logo = process.env.BACKEND_URL + (req.files.logoImg[0].path).slice(6);

  let _class = {
    className,
    logo,
  }

  let _admin = {
    firstName:"admin",
    lastName:"admin",
    username:adminUsername,
    password:adminPassword,
  }

  if(description){
    _class.description = description
  }
  if(address || city || state || pincode){
    let _location = {}
    if(address){
      _location.address = address
    }
    if(city){
      _location.city = city
    }
    if(state){
      _location.state = state
    }
    if(pincode){
      _location.pincode = pincode
    }

    _class.location = _location;
  }
  if(supportEmail){
    _admin.email= supportEmail
    _class.supportEmail= supportEmail
  }
  if(supportPhone){
    _admin.phone= supportPhone
    _class.supportPhone= supportPhone
  }

  const admin = await User.create(_admin);

  if(!admin){
    return res.status(502).json({message:"error creating admin"});
  }

  _class.admin = admin._id;

  if(req.user.role==="superadmin"){
    _class.createdBy = req.user._id;
    _class.isVerified = true;
  }

  const createClass = await Class.create(_class);

  if(!createClass){
    return res.status(500).json({message:"error creating class"});
  }

  return res.status(200).json({message:"Class created successfully"},createClass);
})

export const getSingleClass = catchAsyncError(async (req,res,next) => {
  const {id} = req.params;

  const classFound = await Class.findById(id);

  if(!classFound){
    return res.status(404).json({message:"Class not found!"});
  }
  return res.status(200).json(classFound);
})

export const updateClass = catchAsyncError(async (req,res,next) => {
  const {
    className,
    description,
    supportEmail,
    supportPhone,
    address,
    city,
    state,
    pincode,
    isVerified,
    isActive,
    isDeleted
  } = req.body;

  const classFound = await Class.findById(req.params.id);

  if(!classFound){
    return res.status(404).json({message:"Class not found!"});
  }

  if(className){
    classFound.className = className;
  }
  if(description){
    classFound.description = description;
  }
  if(supportEmail){
    classFound.supportEmail = supportEmail;
  }
  if(supportPhone){
    classFound.supportPhone = supportPhone;
  }
  if(isVerified){
    classFound.isVerified = isVerified;
  }
  if(isActive){
    classFound.isActive = isActive;
  }
  if(isDeleted){
    classFound.isDeleted = isDeleted;
  }

  if(address || city || state || pincode){
    let _location = classFound.location;
    if(address){
      _location.address = address
    }
    if(city){
      _location.city = city
    }
    if(state){
      _location.state = state
    }
    if(pincode){
      _location.pincode = pincode
    }

    classFound.location = _location;
  }

  const updateClass = await classFound.save();

  if(!updateClass){
    return res.status(500).json({message:"error in updating class info"});
  }
  return res.status(200).json(updateClass);
})

export const deleteClass = catchAsyncError(async (req,res,next) => {
  const {id} = req.params;

  const classFound = await Class.findById(id);

  if(classFound){
    classFound.isDeleted = true;
    classFound.save();

    return res.status(200).json({message:"Class deleted successfully."});
  }else{
    return res.status(404).json({message:"Class not found!"});
  }
})

export const getStats = catchAsyncError(async (req, res, next) => {
  const teachers = await User.count({role: "teacher", isDeleted: false});
  const students = await User.count({role: "student", isDeleted: false});
  const questions = await Question.count();

  return res.status(200).json({teachers, students, questions});
})
