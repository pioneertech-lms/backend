import { catchAsyncError } from "../../middleWares/catchAsyncError.js";
import { User } from "../../models/User.js";

export const deleteUser = catchAsyncError(async (req, res, next) => {
    const {id} = req.params;

    const user = await User.findById(id);

    if(user){
        user.isDeleted = true;
        user.save();

        return res.status(200).json({message:"User deleted successfully"});
    } else {
        return res.status(404).json({message:"User not found"});
    }
});

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  let query = {
    isDeleted: false,
  };

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
    isDeleted,
    modules,
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
    user.isActive = isActive;
  }
  if(isDeleted){
    user.isDeleted = isDeleted;
  }
  if(modules){
    user.modules = modules;
  }
  if(role){
    user.role = role;
  }
  if(role){
    user.role = role;
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
