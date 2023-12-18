import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import ErrorHandler from "../utils/ErrorHandler.js";


export const authorizedUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized user" });
  }

  try {
    const jwtToken = authHeader.match(/^Bearer (.+)/)[1];
    const decodedHeader = jwt.decode(jwtToken, { complete: true });

    const currentSession = await Session.findOne({ userId: decodedHeader.payload.id, sessionId: decodedHeader.payload.sessionId });
    if(!currentSession){
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // console.log("decodedHeader", decodedHeader)
    if (!decodedHeader || !decodedHeader.payload.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const user = await User.findById(decodedHeader.payload.id);

    if (user) {
      const currentSession = await Session.findOne({ userId: user._id, sessionId: user.currentSessionId });

      if (currentSession) {
        req.user = user;
        next();
      } else {
        // Old session is not valid; log the user out
        await Session.findOneAndDelete({ sessionId: user.currentSessionId });
        user.currentSessionId = null;
        await user.save();

        return res.status(401).json({ message: "Unauthorized user" });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized user" });
    }
  } catch (error) {
    console.error('Error extracting user info:', error);
    return res.status(401).json({ message: "Unauthorized user" });
  }
};

export const checkUserModuleAccess = (userRole, moduleName) => {
  return (req, res, next) => {
    if(!req.user){
      // console.log(req.user)
      return res.status(501).json({message:"Don't have access"});
    }
    if (req.user.role === "superadmin" || req.user.role === userRole || req.user.modules.includes(moduleName)) {
      next();
    } else {
      return res.status(502).json({message:"Don't have access to this module!"});
      // req.flash("error", "Don't have access to this module!");
      // return res.redirect("/api/user/auth/login");
    }
  };
};
export const extractUserInfo = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return next();
  }

  try {
    const jwtToken = authHeader.match(/^Bearer (.+)/)[1];
    const decodedHeader = jwt.decode(jwtToken, { complete: true });

    if (!decodedHeader || !decodedHeader.payload.id) {
      return next();
    }

    const user = await User.findById(decodedHeader.payload.id);

    if (user) {
      req.user = user;
      res.status(200).json({user : req.user})
    } else {
      console.error('User not found');
      next();
    }
  } catch (error) {
    console.error('Error extracting user info:', error);
    next();
  }

};
