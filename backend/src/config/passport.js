// src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const env = require('./env');

// ── Google OAuth ─────────────────────────────────────────────────────────────
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Try to find by oauthId first, then by email
          let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'google' });

          if (!user && profile.emails?.[0]?.value) {
            user = await User.findOne({ email: profile.emails[0].value });
          }

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails?.[0]?.value || null,
              avatarUrl: profile.photos?.[0]?.value || '',
              oauthProvider: 'google',
              oauthId: profile.id,
              isEmailVerified: true, // Google already verified
              creditBalance: env.SIGNUP_CREDIT_BONUS,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// ── GitHub OAuth ─────────────────────────────────────────────────────────────
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ['user:email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'github' });

          const email = profile.emails?.[0]?.value || null;
          if (!user && email) {
            user = await User.findOne({ email });
          }

          if (!user) {
            user = await User.create({
              name: profile.displayName || profile.username,
              email,
              avatarUrl: profile.photos?.[0]?.value || '',
              oauthProvider: 'github',
              oauthId: profile.id,
              isEmailVerified: !!email,
              creditBalance: env.SIGNUP_CREDIT_BONUS,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
