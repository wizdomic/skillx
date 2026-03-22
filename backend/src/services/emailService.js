// src/services/emailService.js
// Email notifications removed — all notifications are delivered via Socket.io
// in real-time (see src/config/socket.js) which works for all users regardless
// of OAuth provider. Stub kept so existing imports don't break.

const sendSessionRequestEmail  = () => {}
const sendSessionAcceptedEmail = () => {}
const sendSessionCancelledEmail= () => {}

module.exports = { sendSessionRequestEmail, sendSessionAcceptedEmail, sendSessionCancelledEmail }