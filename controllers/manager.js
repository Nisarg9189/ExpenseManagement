const mongoose = require("mongoose");
const User = require("../models/user.js");
const Expense = require("../models/expense.js");
const Manager = require("../models/manager.js");

module.exports.index = async (req, res) => {
  let { id, managerId } = req.params;

  let manager = await Manager.findById(managerId);
  // console.log(manager);
  // console.log(manager);
  let managerEmail = manager.email;
  let user = await User.findOne({ email: managerEmail });
  // console.log(user);
  let pendingUsers = await Expense.find({ status: "Pending", managerId: managerId }).populate("userId", "name");

  let approvedAndRejectedUsers = await Expense.find({ status: { $in: ["Approved", "Rejected"] }, managerId: managerId }).populate("userId", "name");

  let pendingCount = await Expense.countDocuments({ managerId: managerId, status: "Pending" });
  let approvedCount = await Expense.countDocuments({ status: "Approved", managerId: managerId });
  let rejectedCount = await Expense.countDocuments({ status: "Rejected", managerId: managerId });
  let countTeamSize = await User.distinct("_id", { managerId: managerId });
  countTeamSize = countTeamSize.length;
  console.log(countTeamSize);

  let totalExpenseDetails = await Expense.aggregate([
    // Step 1: Filter only this user's documents
    {
      $match: { managerId: new mongoose.Types.ObjectId(managerId) }
    },

    // Step 2: Group and calculate totals
    {
      $group: {
        _id: "$managerId",
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
  ]);
  // console.log(pendingCount);
  // console.log(approvedAndRejectedUsers);
  // console.log("users", pendingUsers);
  totalExpenseDetails = totalExpenseDetails[0] || {};
  // console.log(totalExpenseDetails);
  res.render("managers/manager.ejs", { approvedAndRejectedUsers, pendingUsers, pendingCount, totalExpenseDetails, countTeamSize, approvedCount, rejectedCount, manager, user, id });
}

module.exports.rejectExpense = async (req, res) => {
  let { id, managerId } = req.params;
  let { rejectedUserId } = req.body;
  // console.log(rejectedUserId);

  let user = await Expense.findOne({_id: rejectedUserId});

  await Expense.findOneAndUpdate({ _id: rejectedUserId }, { status: "Rejected" });

  const expenseData = {
    _id: rejectedUserId
  }

  const io = req.app.get("io");

  io.to(`admin_${user.adminId}`).emit("rejectedExpense", expenseData);
  io.to(`user_${user.userId}`).emit("rejectedExpense", expenseData);

  res.redirect(`/companies/${id}/managers/${managerId}`);
}

module.exports.approveExpense = async (req, res) => {
  let { id, managerId } = req.params;
  let { approvedUserId } = req.body;
  console.log(approvedUserId);

  let user = await Expense.findOne({_id: approvedUserId});
  // console.log(user);

  await Expense.findOneAndUpdate({ _id: approvedUserId }, { status: "Approved" });

  const expenseData = {
    _id: approvedUserId
  }

  const io = req.app.get("io");

  io.to(`admin_${user.adminId}`).emit("approvedExpense", expenseData);
  io.to(`user_${user.userId}`).emit("approvedExpense", expenseData);
  
  res.redirect(`/companies/${id}/managers/${managerId}`);
}

module.exports.addExpense = async (req, res) => {
  let { id, adminId, managerId } = req.params;
  console.log(id, adminId, managerId);
  // console.log(req.file);
  let url = req.file.path;
  let filename = req.file.filename;

  let manager = await Manager.findOne({ adminId: adminId, _id: managerId });
  let managerEmail = manager.email;
  console.log(manager);
  let user = await User.findOne({ email: managerEmail });
  let addExpense = await new Expense(req.body.expense);
  // console.log(addExpense);
  addExpense.companyId = id;
  addExpense.adminId = adminId;
  addExpense.userId = user._id;
  addExpense.managerId = user.managerId;
  addExpense.image = {url, filename};
  // console.log(addExpense);
  await addExpense.save();
  console.log(user.managerId);

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
  return res.redirect(`/companies/${id}/managers/${managerId}`);

}

module.exports.managerUserInfo = async(req, res) => {
  let {id, managerId} = req.params;

  let users = await User.find({managerId: managerId}).populate("companyId", "name");
  // console.log(users);

  res.render("managers/managerUserInfo.ejs", {users, id, managerId});
};

module.exports.managerExpensesDetails = async (req, res) => {
    let { id, adminId, userId } = req.params;
    let user = await User.findById(userId).populate("companyId", "name").populate("managerId");
    console.log(user);
    let manager = await Manager.findOne({email: user.email});
    let details = await Expense.find({ userId: userId }).lean();
    // console.log(details);
    let totalExpenseDetails = await Expense.aggregate([
      // Step 1: Filter only this user's documents
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
  
      // Step 2: Group and calculate totals
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
    ]);
  
    // console.log(totalExpenseDetails);
    totalExpenseDetails = totalExpenseDetails[0] || {};
    res.render("managers/managerExpensesDetails.ejs", { details, user, totalExpenseDetails, adminId, id, manager });
  };

module.exports.managerUserExpenses = async(req, res) => {
      let { id, adminId, userId } = req.params;
      let user = await User.findById(userId);
      console.log(user);
      let details = await Expense.find({ userId: userId }).lean();
      // console.log(details);
      let totalExpenseDetails = await Expense.aggregate([
        // Step 1: Filter only this user's documents
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
    
        // Step 2: Group and calculate totals
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
      ]);
    
      // console.log(totalExpenseDetails);
      totalExpenseDetails = totalExpenseDetails[0] || {};
      res.render("managers/managerUserExpensesDetails.ejs", { details, user, totalExpenseDetails, adminId, id });
      // console.log(totalExpenseDetails);
  }