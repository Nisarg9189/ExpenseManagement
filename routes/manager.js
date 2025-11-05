const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const {addExpenseSchema} = require("../schema.js");
const ExpressError = require("../utils/expressError.js");
const managerControllers = require("../controllers/manager.js");
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

router.get("/", isLoggedIn, wrapAsync(managerControllers.index));

router.patch("/reject", isLoggedIn, wrapAsync(managerControllers.rejectExpense));

router.patch("/approve", isLoggedIn, wrapAsync(managerControllers.approveExpense));

router.post("/:managerId", isLoggedIn, upload.single("expense[image]"), validateExpense, wrapAsync(managerControllers.addExpense));

router.get("/user", isLoggedIn, wrapAsync(managerControllers.managerUserInfo));

router.get("/expenses/managers", isLoggedIn, wrapAsync(managerControllers.managerExpensesDetails));

router.get("/manager/expenses", isLoggedIn, wrapAsync(managerControllers.managerUserExpenses));

module.exports = router;