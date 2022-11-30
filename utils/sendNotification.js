var admin = require("firebase-admin");
var fcm = require("fcm-notification");
var serviceAccount = require("../config/service-acount-file.json");
const certPath = admin.credential.cert(serviceAccount);
var FCM = new fcm(certPath);

function sendPushNotification(fcm_token, title, body) {
  try {
    let message = {
      android: {
        notification: {
          title: title,
          body: body,
        },
      },
      token: fcm_token,
    };

    FCM.send(message, function (err, resp) {
      if (err) {
        throw err;
      } else {
        console.log("Successfully sent notification");
      }
    });
  } catch (err) {
    throw err;
  }
}

module.exports = { sendPushNotification };
