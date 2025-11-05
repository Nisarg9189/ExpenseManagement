const express = require("express");
const router = express.Router({mergeParams: true});
const WrapAsync = require("../utils/wrapAsync.js");
const {addUserSchema} = require("../schema.js");
const adminControllers = require("../controllers/admin.js");
const ExpressError = require("../utils/expressError.js");
const {isLoggedIn} = require("../utils/authentication.js");

const validateUser = (req, res, next) => {
    let {error} = addUserSchema.validate(req.body);

    if(error) {
        let msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, msg);
    } else {
        next();
    }
}

//admin dashboard for particuler company
router.get("/", isLoggedIn, WrapAsync(adminControllers.index));


//Add user route
router.post("/", isLoggedIn, validateUser, WrapAsync(adminControllers.addUser));


//Delete user route
router.delete("/users/:userId/delete", isLoggedIn, WrapAsync(adminControllers.destroyUser));

//Edit user route
router.patch("/users/:userId/edit", isLoggedIn, WrapAsync(adminControllers.editUser));

//get user route
router.get("/companies/users/:reqUserId/details", isLoggedIn, WrapAsync(adminControllers.getUser));

//get user details route
router.get("/users/details", isLoggedIn, WrapAsync(adminControllers.getUserDetails));

//get user expense route
router.get("/users/:userId/expenses", isLoggedIn, WrapAsync(adminControllers.getUserExpense));

router.get("/profile", isLoggedIn, WrapAsync(adminControllers.adminProfile));

module.exports = router;