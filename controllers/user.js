const mongoose = require("mongoose");
const User = require("../models/user.js");
const Expense = require("../models/expense.js");

module.exports.index = async (req, res) => {
  let { id, userId } = req.params;

  let user = await User.findById(userId).lean();
  // console.log(user);
  let expenseDetails = await Expense.find({ userId }).lean();
  let totalExpenseDetails = await Expense.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) }
    },

    {
      $group: {
        _id: "$userId",
        totalExpenseRised: { $sum: "$amount" },
        totalApproved: {
          $sum: { $cond: [{ $eq: ["$status", "Approved"] }, "$amount", 0] }
        },
        totalRejected: {
          $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, "$amount", 0] }
        },
        totalPending: {
          $sum: { $cond: [{ $eq: ["$status", "Pending"] }, "$amount", 0] }
        }
      }
    }
  ])

  console.log(totalExpenseDetails);
  if(totalExpenseDetails.length === 0) {
    totalExpenseDetails.push({
      totalExpenseRised: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalPending: 0
    });
  }
  let totalRejected = totalExpenseDetails[0].totalRejected;
  let totalApproved = totalExpenseDetails[0].totalApproved;
  let totalPending = totalExpenseDetails[0].totalPending;
  let pending = await Expense.countDocuments({ userId: userId, status: "Pending" });
  let approved = await Expense.countDocuments({ userId: userId, status: "Approved" });
  let rejected = await Expense.countDocuments({ userId: userId, status: "Rejected" });
  // console.log(pending);
  // console.log(approved);
  // console.log(rejected);
  // console.log(userDetails);
  // console.log(totalExpenseDetails);
  totalExpenseDetails = totalExpenseDetails[0] || {};
  res.render("users/user.ejs", { totalExpenseDetails, expenseDetails, user, pending, approved, rejected, userId, totalApproved, totalPending, totalRejected, id });
}


module.exports.addExpense = async (req, res) => {
  let { id, adminId, userId } = req.params;
  // console.log(req.body.expense);
  
  if (!req.file) {
    console.log("none");
    return res.status(400).json({ message: "No file uploaded" });
  }
  let url = req.file.path;
  let filename = req.file.filename;
  // console.log(url, filename);
  let user = await User.findOne({ adminId: adminId, _id: userId });
  console.log(user);
  let addExpense = await new Expense(req.body.expense);
  // console.log(addExpense);
  addExpense.companyId = id;
  addExpense.adminId = adminId;
  addExpense.userId = userId;
  addExpense.managerId = user.managerId;
  addExpense.image = { url, filename };
  // console.log(addExpense);
  await addExpense.save();

  const expenseData = {
    _id: addExpense._id,
    title: req.body.expense.title,
    userName: user.name,
    category: addExpense.category,
    amount: addExpense.amount,
    status: "Pending",
    date: addExpense.date,
    image: url
  }

  const io = req.app.get("io");

  io.to(`admin_${adminId}`).emit("addExpense", expenseData);
  io.to(`manager_${user.managerId}`).emit("addExpense", expenseData);

  res.redirect(`/companies/${id}/users/${userId}`);
}

module.exports.userDetails = async (req, res) => {
    let {id, userId} = req.params;

    let user = await User.findOne({_id: userId}).populate("managerId").populate("companyId");
    // console.log(user);

    res.render("users/userDetails.ejs", {user, id});
}
