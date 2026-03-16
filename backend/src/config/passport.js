// src/config/passport.js
const passport          = require('passport')
const GoogleStrategy    = require('passport-google-oauth20').Strategy
const GitHubStrategy    = require('passport-github2').Strategy
const User = require('../models/User')
const env  = require('./env')

const upsertOAuthUser = async ({ oauthId, oauthProvider, email, name, avatarUrl }) => {
  let user = await User.findOne({ oauthId, oauthProvider })
  if (!user && email) user = await User.findOne({ email })
  if (!user) {
    user = await User.create({
      name,
      email:           email || null,
      avatarUrl:       avatarUrl || '',
      oauthProvider,
      oauthId,
      isEmailVerified: !!email,
      creditBalance:   env.SIGNUP_CREDIT_BONUS,
    })
  }
  return user
}

// ── Google ────────────────────────────────────────────────────────────────────
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL:  env.GOOGLE_CALLBACK_URL,
    },
    async (_access, _refresh, profile, done) => {
      try {
        const user = await upsertOAuthUser({
          oauthId:      profile.id,
          oauthProvider: 'google',
          email:        profile.emails?.[0]?.value,
          name:         profile.displayName,
          avatarUrl:    profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) { done(err, null) }
    }
  ))
}

// ── GitHub ────────────────────────────────────────────────────────────────────
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID:     env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL:  env.GITHUB_CALLBACK_URL,
      scope:        ['user:email'],
    },
    async (_access, _refresh, profile, done) => {
      try {
        const user = await upsertOAuthUser({
          oauthId:      profile.id,
          oauthProvider: 'github',
          email:        profile.emails?.[0]?.value,
          name:         profile.displayName || profile.username,
          avatarUrl:    profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) { done(err, null) }
    }
  ))
}

module.exports = passport