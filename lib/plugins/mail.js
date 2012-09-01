var nodemailer = require('nodemailer');


function mail(mailSettings) {
  var transport = nodemailer.createTransport('SMTP', {
    service: mailSettings.auth.service,
    auth: mailSettings.auth
  });

  this.register(function(err) {
    var mailOptions = {
      from: mailSettings.from,
      to: mailSettings.to,
      subject: '[Erroneous Error]: "' + err.msg + '"',
      text: JSON.stringify(err)
    };

    transport.sendMail(mailOptions, function(error, res) {
      if (error) {
        console.error(error);
      }
    });
  });

  return this;
}

module.exports = mail;
