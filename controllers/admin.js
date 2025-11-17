const mongoose = require("mongoose");
// const express = require("express");
// const app = express();
const Admin = require("../models/admin.js");
const User = require("../models/user.js");
const Expense = require("../models/expense.js");
const Manager = require("../models/manager.js");
const Company = require("../models/company.js");
const ExpressError = require("../utils/expressError.js");
const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.ExpenseHub_API;
const tranEmailApi = new Sib.TransactionalEmailsApi();

module.exports.index = async (req, res) => {
  let { id, adminId } = req.params;
  let company = await Company.findOne({ _id: id });
  let admin = await Admin.findOne({ _id: adminId }).populate("companyId").lean();
  // console.log(admin);
  let users = await User.find({ adminId: adminId }).populate("managerId").populate("adminId") // find users under specific admin of company
  // console.log("users", users);
  let expenses = await Expense.find({ adminId: adminId, companyId: id }).populate("userId");
  let totalExp = await Expense.aggregate([
    {
      $match: { adminId: new mongoose.Types.ObjectId(adminId) }
    },

    {
      $group: {
        _id: "$adminId",
        totalExpRised: { $sum: "$amount" },
        rejectedSum: {
          $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, "$amount", 0] }
        },
      }
    }
  ]);

  let totalSum = 0;
  let rejectedSum = 0;
  if (totalExp.length > 0) {
    totalSum = totalExp[0].totalExpRised;
    rejectedSum = totalExp[0].rejectedSum;
    // console.log(rejectedSum);
  }
  let pendingCount = await Expense.countDocuments({ status: "Pending", adminId: adminId });
  let rejectedCount = await Expense.countDocuments({ status: "Rejected", adminId: adminId });

  // console.log(expenses);

  let managers = await Manager.find({ companyId: id });
  // console.log("managers", managers);
  res.render("admins/admin.ejs", { users, totalSum, pendingCount, rejectedCount, id, adminId, managers, expenses, admin, company, rejectedSum });
}

module.exports.addUser = async (req, res) => {
  console.log("💥 addUser called!", req.body);
  let { id, adminId } = req.params;
  // console.log(id, adminId);
  // console.log(req.body.expense);
  let { name, email, password, role, managerId } = req.body.expense;
  if (!managerId) managerId = null;
  if (role.toLowerCase() === "manager") {
    let newManager = new Manager({
      companyId: id,
      adminId: adminId,
      name: name,
      email: email
    });
    await newManager.save();
  }
  let newUser = new User({
    companyId: id,
    adminId: adminId,
    managerId: managerId,
    name: name,
    role: role,
    email: email,
  });

  console.log(newUser);

  let user = await User.register(newUser, password);
  // console.log(user);
  let ioManager = null;
  if (managerId) {
    let assignManager = await Manager.findOne({ _id: managerId });

    if (assignManager) {
      ioManager = {
        _id: assignManager._id,
        name: assignManager.name
      }
    }
  }
  // console.log(assignManager);
  const io = req.app.get("io");
  const ioUser = {
    _id: user._id,
    name: name,
    role: role,
    email: email
  }
  // console.log("Emitting employeeAdded event...", ioUser, ioManager);
  // console.log("Emitting to room admin_" + adminId);
  // io.to(`admin_${adminId}`).emit("employeAdded", {user: ioUser, assignManager: ioManager});



  const mailOptions = {
    from: "nisargpatel460@gmail.com",
    to: email,
    subject: "Your ExpenseHub Account Credentials",
    text: `Hello ${name}, welcome to our service!
    Your account has been created with the following credentials: 
    Email: ${email}
    Password: ${password}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // console.error(error);
      throw new ExpressError("500", error.message);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  res.redirect(`/companies/${id}/admins/${adminId}`);
}

module.exports.destroyUser = async (req, res, next) => {
  let { id, adminId, userId } = req.params;

  let user = await User.findOne({ _id: userId, adminId: adminId, companyId: id });
  // console.log(user);

  if (user.role === "manager") {
    let manager = await Manager.findOne({ email: user.email }).lean();
    let exists = await User.countDocuments({ managerId: manager._id });
    if (exists > 0) {
      return next(new ExpressError("400", "you assign this role for other employee as their manager so you can't delete it"));
    }
    await Manager.findOneAndDelete({ email: user.email });
  }

  await Expense.deleteMany({ userId: userId });
  await User.findByIdAndDelete(userId);

  const mailOptions = {
    from: "nisargpatel460@gmail.com",
    to: user.email,
    subject: "Account Deletion Notification",
    text: `Hello ${user.name},
    
    We wanted to inform you that your account has been deleted from our ExpenseHub system. If you have any questions or concerns, please feel free to reach out to us.

    Best regards,
    ExpenseHub Team`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // console.error(error);
      throw new ExpressError("500", error.message);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  res.redirect(`/companies/${id}/admins/${adminId}`);
  // res.send("user deleted sucussfull");
}

module.exports.editUser = async (req, res, next) => {
  let { id, adminId, userId } = req.params;
  console.log(userId);
  let { managerId } = req.body.expense;
  if (!managerId) managerId = null;
  let user = await User.findById(userId);
  console.log("user", user);
  // console.log(user);
  // console.log(managerId);
  let manager = await Manager.findById(managerId);
  // console.log(manager);
  if (manager.email && user.email === manager.email) {
    return next(new ExpressError("400", "can't assign own as expense manager"));
  }


  // let manager = null;
  // if (managerId) {
  //   manager = await Manager.findById(managerId);
  //   // console.log(manager);
  //   if (manager && manager.email && user.email === manager.email) {
  //     return next(new ExpressError("400", "can't assign own as expense manager"));
  //   }
  // }


  await User.findByIdAndUpdate(userId, { managerId: managerId });

  if (user.role === "user" && req.body.expense.role === "manager") {
    if (!user.email) {
      return next(new ExpressError(400, "Email is required to promote user to manager"));
    }
    let newManager = await new Manager({ companyId: user.companyId, adminId: user.adminId, name: req.body.expense.name, email: user.email });
    await newManager.save();
  } else if (user.role === "manager" && req.body.expense.role === "user") {
    let manager = await Manager.findOne({ email: user.email }).lean();
    let exists = await User.countDocuments({ managerId: manager._id });
    if (exists > 0) {
      return next(new ExpressError("400", "you assign this role for other employee as their manager so you can't change role"));
    }
    await Manager.findOneAndDelete({ email: user.email, companyId: id, adminId: adminId });
  } else {
    // user.email = req.body.expense.email;
    if (req.body.expense.role == "manager") {
      let existsManager = await Manager.findOne({ email: user.email });
      existsManager.name = req.body.expense.name;
      existsManager.email = user.email;
      let a = await existsManager.save();
      console.log(a);
    }
  }

  // user.name = req.body.expense.name;
  user.managerId = req.body.expense.managerId || null;
  user.role = req.body.expense.role;
  user.name = req.body.expense.name;
  await Expense.findOneAndUpdate({ adminId: adminId, userId: userId }, { managerId: managerId });

  let newUser = await user.save();
  console.log(newUser);
  let details = (await newUser.populate("managerId")).toObject();

  // const mailOptions = {
  //   from: "nisargpatel460@gmail.com",
  //   to: user.email,
  //   subject: "Edited User Info",
  //   text: `Your Edited Info,
  //   Name: ${details.name}
  //   Role: ${details.role}
  //   Assigned Manager: ${details.managerId ? details.managerId.name : "No Manager Assigned"}

  //   Best regards,
  //   ExpenseHub Team`
  // };

    try {
    const sender = { email: 'nisargpatel460@gmail.com', name: 'ExpenseHub' };
    const receivers = [{ email: user.email }];

    const managerName = details.managerId ? details.managerId.name : "No Manager Assigned";

    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Edited User Info',
      htmlContent: `
        <p>Hello ${details.name},</p>
        <p>Your user information has been updated in <b>ExpenseHub</b>.</p>
        <p>
          <b>Name:</b> ${details.name}<br>
          <b>Role:</b> ${details.role}<br>
          <b>Assigned Manager:</b> ${managerName}
        </p>
        <br>
        <p>Best regards,<br><b>ExpenseHub Team</b></p>
      `,
      textContent: `Your Edited Info,
Name: ${details.name}
Role: ${details.role}
Assigned Manager: ${managerName}

    Best regards,
    ExpenseHub Team`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // console.error(error);
      throw new ExpressError("500", error.message);
    } else {
      console.log("Email sent: " + info.response);
    }
  });


  res.redirect(`/companies/${id}/admins/${adminId}`);
  // res.send("updated");
}

module.exports.getUser = async (req, res) => {
  let { reqUserId } = req.params;
  let exp = await Expense.find({ userId: reqUserId }).populate("userId").lean();
  // console.log(exp);
  res.render("userView.ejs");
}

module.exports.getUserDetails = async (req, res) => {
  let { id, adminId } = req.params;
  let users = await User.find({ companyId: id, adminId: adminId }).populate("companyId").lean();
  // console.log(users);
  res.render("admins/userProfileCard.ejs", { users, adminId, id });
}

module.exports.getUserExpense = async (req, res) => {
  let { id, adminId, userId } = req.params;
  let user = await User.findById(userId);
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
  res.render("admins/expenseDetails.ejs", { details, user, totalExpenseDetails, adminId, id });
}

module.exports.adminProfile = async (req, res) => {
  let { id, adminId } = req.params;
  let admin = await Admin.findOne({ _id: adminId }).populate("companyId").lean();
  // console.log(admin);
  res.render("admins/adminProfile.ejs", { admin, id, adminId });
}
