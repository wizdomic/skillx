// src/jobs/sessionReminder.js
// Runs every 15 minutes. Sends notifications for sessions starting in ~1 hour.

const cron = require('node-cron');
const Session = require('../models/Session');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { getIO } = require('../config/socket');

const runSessionReminders = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const fiftyMinFromNow = new Date(now.getTime() + 50 * 60 * 1000);

      // Sessions starting in 50–60 minutes that are still accepted
      const upcomingSessions = await Session.find({
        status: 'accepted',
        scheduledAt: { $gte: fiftyMinFromNow, $lte: oneHourFromNow },
      })
        .populate('teacherId', 'name email')
        .populate('learnerId', 'name email')
        .populate('skillId', 'name');

      for (const session of upcomingSessions) {
        const message = `Your "${session.skillId.name}" session starts in about 1 hour.`;

        // Push via Socket.IO
        try {
          const io = getIO();
          io.to(`user:${session.teacherId._id}`).emit('session:reminder', {
            sessionId: session._id,
            message,
            videoLink: session.videoLink,
          });
          io.to(`user:${session.learnerId._id}`).emit('session:reminder', {
            sessionId: session._id,
            message,
            videoLink: session.videoLink,
          });
        } catch (_) {}

        // Email fallback
        for (const participant of [session.teacherId, session.learnerId]) {
          if (participant.email) {
            emailService
              .sendEmail({
                to: participant.email,
                subject: `⏰ Reminder: Session in 1 hour — ${session.skillId.name}`,
                html: `
                  <p>Hi ${participant.name},</p>
                  <p>${message}</p>
                  <a href="${session.videoLink}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
                    Join Session
                  </a>
                `,
              })
              .catch(console.error);
          }
        }
      }

      if (upcomingSessions.length > 0) {
        console.log(`⏰  Sent reminders for ${upcomingSessions.length} upcoming session(s)`);
      }
    } catch (err) {
      console.error('❌  Session reminder job failed:', err.message);
    }
  });

  console.log('✅  Session reminder job scheduled');
};

module.exports = { runSessionReminders };
