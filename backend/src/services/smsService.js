// src/services/smsService.js
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NODE_ENV } = require('../config/env');

let twilioClient = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send an SMS. In development without Twilio creds, logs to console.
 */
const sendSMS = async (to, body) => {
  if (!twilioClient) {
    console.log(`\n📱  [DEV SMS] To: ${to}\n   Message: ${body}\n${'─'.repeat(40)}`);
    return { sid: 'dev-mode' };
  }

  return twilioClient.messages.create({
    body,
    from: TWILIO_PHONE_NUMBER,
    to,
  });
};

const sendPhoneOTP = async (phone, otp) => {
  return sendSMS(phone, `Your Skill Exchange verification code is: ${otp}. Expires in 10 minutes.`);
};

module.exports = { sendSMS, sendPhoneOTP };
