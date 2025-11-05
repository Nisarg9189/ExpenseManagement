const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const {addExpenseSchema} = require("../schema.js");
const ExpressError = require("../utils/expressError.js");
const userControllers = require("../controllers/user.js");
const {isLoggedIn} = require("../utils/authentication.js");

const validateExpense = (req, res, next) => {
  let {error} = addExpenseSchema.validate(req.body);

  if(error) {
      let msg = error.details.map(el => el.message).join(",");
      throw new ExpressError(400, msg);
  } else {
      next();
  }
}

//user route
router.get("/users/:userId", isLoggedIn, wrapAsync(userControllers.index));

//add expense route
router.post("/admins/:adminId/users/:userId", isLoggedIn, upload.single("expense[image]"), validateExpense, wrapAsync(userControllers.addExpense));

//user details route
router.get("/users/:userId/details", isLoggedIn, wrapAsync(userControllers.userDetails));

module.exports = router;