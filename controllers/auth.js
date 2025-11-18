const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/user.js");
const Admin = require("../models/admin.js");
const Manager = require("../models/manager.js");
const ExpressError = require("../utils/expressError.js");
const Company = require("../models/company.js");
const { signUp } = require("../schema.js");
const { model } = require("mongoose");
const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.ExpenseHub_API;
const tranEmailApi = new Sib.TransactionalEmailsApi();

module.exports.login = async (req, res, next) => {
  // console.log(req.user);
  let email = req.user.email;
  let { role } = req.body;
  // console.log(role);
  let userDetails = await User.findOne({ email: email });
  // console.log(userDetails);
  if (userDetails.role === "admin" && role === "admin") {
    let admin = await Admin.findOne({ companyId: userDetails.companyId });
    // console.log(admin);
    return res.redirect(`/companies/${userDetails.companyId}/admins/${admin._id}`);
  } else if (userDetails.role == "user" && role === "user") {
    return res.redirect(`/companies/${userDetails.companyId}/users/${userDetails._id}`);
  } else if (userDetails.role === "manager" && role === "manager") {
    let manager = await Manager.findOne({ email: userDetails.email });
    return res.redirect(`/companies/${userDetails.companyId}/managers/${manager._id}`);
  }
  else {
    req.flash("error", "Invalid Credentials");
    return res.redirect("/");
  }
};

module.exports.signup = async (req, res, next) => {
  try {
    const { name, address, adminname, email, password } = req.body.company;

    // console.log(password);
    // Create and save the company
    const newCompany = new Company({ name, address });
    await newCompany.save();

    // Create admin and link companyId
    const newUser = new User({
      companyId: newCompany._id,
      name: adminname,
      email,
      role: "admin",
    });

    const newAdmin = new Admin({
      companyId: newCompany._id,
      name: adminname
    })

    // Register the admin with hashed password
    await User.register(newUser, password); // provided by passport-local-mongoose
    await newAdmin.save();
    // Redirect after successful registration
    // res.redirect(`/companies/${newCompany._id}/admins/${newAdmin._id}`);
    try {
      const sender = { email: 'nisargpatel460@gmail.com', name: 'ExpenseHub' };
      const receivers = [{ email }];

      const response = await tranEmailApi.sendTransacEmail({
        sender,
        to: receivers,
        subject: 'Your ExpenseHub Account Credentials',
        htmlContent: `<p>Hello ${adminname}, welcome to ExpenseHub!<br>
      Your account has been created with the following credentials:<br>
      <b>Email:</b> ${email}<br>
      <b>Password:</b> ${password}</p>`
      });

      console.log('Email sent:', response);
    } catch (e) {
      console.error('Error sending email:', error);
      // next(new ExpressError(500, "email error"));
    }
    return res.redirect("/");
  } catch (e) {
    next(new ExpressError(400, "Wrong credentials"));
  }
};

module.exports.logout = async (req, res) => {
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        throw new ExpressError(500, "Something went wrong while logging out!");
      }
      req.flash("success", "Logged out successfully!");
      res.redirect("/");
    })
  }
}