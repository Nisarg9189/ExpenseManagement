const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/user.js");
const Admin = require("../models/admin.js");
const Manager = require("../models/manager.js");
const ExpressError = require("../utils/expressError.js");
const Company = require("../models/company.js");
const {signUp} = require("../schema.js");
const authControllers = require("../controllers/auth.js");

const validateCompany = (req, res, next) => {
  const {error} = signUp.validate(req.body);

  if(error) {
      const msg = error.details.map(el => el.message).join(",");
      throw new ExpressError(400, msg);
  } else {
      next();
  }
}

router.post("/login", passport.authenticate("local", { failureRedirect: "/", failureFlash: "Invalid Credentials" }), wrapAsync(authControllers.login));

router.post("/signup", validateCompany, authControllers.signup);

//logout
router.post("/logout", wrapAsync(authControllers.logout));

module.exports = router;