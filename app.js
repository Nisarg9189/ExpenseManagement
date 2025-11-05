if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set("io", io);
const nocache = require("nocache");
app.use(nocache());
const mongoose = require("mongoose");
const Company = require("./models/company.js");
const Admin = require("./models/admin.js");
const Manager = require("./models/manager.js");
const User = require("./models/user.js");
const Expense = require("./models/expense.js");
const path = require("path");
const methodOverride = require("method-override");
const ExpressError = require("./utils/expressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const wrapAsync = require("./utils/wrapAsync.js");

const adminRoutes = require("./routes/admin.js");
const userRoutes = require("./routes/user.js");
const managerRoutes = require("./routes/manager.js");
const authRoutes = require("./routes/auth.js");


app.locals.moment = require('moment');
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("ejs", ejsMate);
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));


const dbUrl = process.env.ATLAS_URL;


main().then(() => {
  console.log("connected to DB");
}).catch(err => console.log("Connection error:",err));

async function main() {
  // await mongoose.connect('mongodb://127.0.0.1:27017/expenseManagement');
  await mongoose.connect(dbUrl);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const sessionInfo = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionInfo));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(
  { usernameField: "email" }, // important
  User.authenticate() // if using passport-local-mongoose
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  next();
});

io.on("connection", (socket) => {
  // console.log("new client connected,", socket.id);
  socket.on("joinRoom", (data) => {
    if(data.adminId) {
      socket.join(`admin_${data.adminId}`);
      console.log("admin joined", data.adminId, "...", socket.id);
    }

    if(data.managerId) {
      socket.join(`manager_${data.managerId}`);
      console.log("manager joined", data.managerId, "...", socket.id);
    }
    
    if(data.userId) {
      socket.join(`user_${data.userId}`);
      console.log("user joined", data.userId, "...", socket.id);
    }
  });
});

// Home route
app.get("/", nocache(), (req, res, next) => {
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) return next(err);

      req.session.destroy(() => {
        res.clearCookie("connect.sid", {path: "/"});
        return res.render("auth.ejs"); // login page again
      });
    });
  } else {
    res.render("auth.ejs");
  }
});

// Expense Details At Review route for manager
app.get("/helper/expenses/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    let details = await Expense.findOne({_id: id}).populate("userId", "name").lean();
    res.json(details);
}));

// User details for admin for edit route
app.get("/helper/details/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    let userDetails = await User.findOne({_id: id}).populate("managerId", "name").lean();
    res.json(userDetails);
}));

app.use("/auth", authRoutes);
app.use("/companies/:id/admins/:adminId", adminRoutes);
app.use("/companies/users/:userId", adminRoutes);
app.use("/companies/:id", userRoutes);
app.use("/companies/:id/managers/:managerId", managerRoutes);
app.use("/companies/:id/admins/:adminId/managers", managerRoutes);
app.use("/companies/:id/admins/:adminId/users/:userId", managerRoutes);


app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  // console.log("err", err);
  res.render("error.ejs", { err });
});

server.listen("8080", () => {
  console.log("server running on port 8080");
})
