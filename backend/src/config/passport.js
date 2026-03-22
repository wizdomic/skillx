// src/config/passport.js
const passport       = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const GitHubStrategy = require('passport-github2').Strategy
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
          oauthId:       profile.id,
          oauthProvider: 'google',
          email:         profile.emails?.[0]?.value,
          name:          profile.displayName,
          avatarUrl:     profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) { done(err, null) }
    }
  ))
}

// ── GitHub ────────────────────────────────────────────────────────────────────
// GitHub users can set their email to private. 
// When they do, profile.emails is empty and we have to fetch via API using the access token.
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID:     env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL:  env.GITHUB_CALLBACK_URL,
      scope:        ['user:email'],
    },
    async (accessToken, _refresh, profile, done) => {
      try {
        let email = profile.emails?.[0]?.value || null

        // If email is missing (private GitHub account), fetch via API
        if (!email) {
          try {
            const res = await fetch('https://api.github.com/user/emails', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'SkillX',
              },
            })
            if (res.ok) {
              const list = await res.json()
              // Prefer primary + verified, fall back to any verified
              const primary  = list.find(e => e.primary && e.verified)
              const verified = list.find(e => e.verified)
              email = primary?.email || verified?.email || list[0]?.email || null
            }
          } catch (_) { /* proceed without email */ }
        }

        const user = await upsertOAuthUser({
          oauthId:       profile.id,
          oauthProvider: 'github',
          email,
          name:          profile.displayName || profile.username,
          avatarUrl:     profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) { done(err, null) }
    }
  ))
}

module.exports = passport