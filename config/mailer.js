var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "mgfortuna9411@gmail.com",
    pass: "zjqi uaes anwi szug",
  },
});

module.exports = transporter;


// var transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false, // Usar `false` con `port: 587` porque la conexión TLS se establece después de la conexión inicial
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });