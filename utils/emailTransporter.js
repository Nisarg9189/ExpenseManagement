const nodemailer = require("nodemailer");

module.exports.transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nisargpatel460@gmail.com",
      pass: "nplw bmsj akve rnaa"  // App password here
    }
});