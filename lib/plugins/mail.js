/**
 * mail plugin
 *  - Sends a mail to a specified email-adress each time an error occurs
 **/
(function() {
  var nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {
    console.warn('nodemailer must be installed to use the mail plugin\n' +
      'Please install it by issuing "npm install nodemailers"');

    return false;
  }


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
})();
