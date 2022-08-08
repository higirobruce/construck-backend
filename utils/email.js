const nodemailer = require("nodemailer");
var nodeoutlook = require("nodejs-nodemailer-outlook");

// Set this from config or environment variable.
const PASSWORD = "Blessings_198912";

async function send365Email(from, to, subject, html, text) {
  nodeoutlook.sendEmail({
    auth: {
      user: from,
      pass: PASSWORD,
    },
    from: from,
    to: to,
    subject: subject,
    html: "<b>This is bold text</b>",
    text: text,
    replyTo: from,

    onError: (e) => {},
    onSuccess: (i) => {},
  });
}

module.exports = send365Email;
