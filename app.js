import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import flash from "express-flash";
import path from "path";
import { fileURLToPath } from "url";
import methodOverride from "method-override";
import rfs from "rotating-file-stream";
import ErrorMiddleware from "./middleWares/Error.js";
import MongoStore from "connect-mongo";
import passport from "passport";
import morgan from "morgan";
import expressSanitizer from "express-sanitizer";
import { config } from "dotenv";

config({ path: "./config/config.env" });

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// importing middleWares

// const corsOptions = {
//   origin: ["http://pioneer-lms.test"],
//   optionsSuccessStatus: 200,
// };

app.use(cors());
app.use(cookieParser());
// app.use(flash());

// storage middleware
app.get("/assets/*", getFileStream);

app.use(
  session({
    saveUninitialized: false,
    resave: false,
    key: process.env.KEY,
    secret: process.env.SECRET,
    secure: true,
    httpOnly: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_LOCAL_URI,
      ttl: 7 * 24 * 60 * 60,
      autoRemove: "native",
      collectionName: "sessions",
      touchAfter: 12 * 3600,
    }),
    cookie: {
      maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
    },
  })
);

// Create a rotating write stream
let accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "logs"),
});

app.set("view engine", "ejs");
app.use("/api", express.json());
app.use("/api", express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(methodOverride("_method"));
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
app.use(passport.initialize());
app.use(passport.session())
app.use(flash());
app.use(expressSanitizer());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(function (req, res, next) {
  res.locals.currentUser = req.user || null;
  res.locals.username = req.user
    ? req.user.role === "student"
      ? req.user.username
      : req.user.createdBy.username
    : null;
  next();
});

// seed script
import { seed } from "./config/seed.js";
seed();

// User route imports
import userAuthRoutes from "./routes/user/authRoute.js";
app.use("/api/user/auth", userAuthRoutes);

// Admin Routes
import adminPrimaryRoutes from "./routes/admin/primaryRoute.js";
app.use("/api/admin/", adminPrimaryRoutes);

// util routes
import utilsRoute from './routes/user/utilsRoute.js';
app.use("/api/utils/", utilsRoute);

// class routes
import classRoute from './routes/class/primaryRoute.js';
app.use("/api/class/", classRoute);

// question routes
import questionRoute from './routes/class/questionRoute.js';
app.use("/api/question/", questionRoute);

// report routes
import reportRoute from './routes/class/reportRoute.js';
app.use("/api/report/", reportRoute);

// test routes
import testRoute from './routes/class/testRoute.js';
import { getFileStream } from "./config/storageObject.js";
app.use("/api/test/", testRoute);

// // Teacher route imports
// import teacherRoutes from "./routes/teacher/primaryRoute.js";
// app.use("/api/teacher/", teacherRoutes);
//
// // Student route imports
// import studentRoutes from "./routes/student/primaryRoute.js";
// app.use("/api/student",studentRoutes);

// test route
app.get("/status", (req, res) => {
  // res.render("test");
  res.status(200).send("Server is up & running...")
})

import { createRequestHandler } from "@remix-run/express";

app.use("/build", express.static("../frontend/public/build", { immutable: true, maxAge: "1y" }));
app.use("/", express.static("../frontend/public", { maxAge: "1h" }));
app.all(
  "*",
  async (req, res, next) => {
    return await createRequestHandler({
      build: await import("../frontend/build/index.js"),
    })(req, res, next)
  }
);

app.use(ErrorMiddleware);
export default app;
