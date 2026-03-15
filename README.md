# SkillX — Peer-to-Peer Skill Exchange Platform

A full-stack web app where people teach what they know and learn what they love — powered by a credit system. Every session you teach earns you 1 credit. Spend credits to learn from others.

---

## Tech Stack

**Backend** — Node.js · Express · MongoDB (Mongoose) · Socket.IO · JWT  
**Frontend** — React · Vite · TailwindCSS · Zustand

---

## Features

- 🔐 Email/password auth with OTP verification + Google & GitHub OAuth
- 🤝 Skill-based matchmaking algorithm — ranked by shared skills & rating
- 📅 Session booking, acceptance, confirmation & cancellation
- 💬 Real-time chat with typing indicators (Socket.IO)
- 🪙 Credit wallet — earn by teaching, spend to learn
- ⭐ Post-session ratings & reviews
- 📋 Public skill request board
- 🌙 Dark / light mode toggle (persists preference)
- 213 seeded skills across 10 categories

---

## Project Structure

```
skill-exchange/
├── backend/
│   ├── src/
│   │   ├── config/        # env, db, redis, socket, passport
│   │   ├── middleware/     # auth, rate limiter, error handler
│   │   ├── models/         # User, Skill, UserSkill, Session, Rating, Message…
│   │   ├── modules/        # auth, users, skills, sessions, chat, credits…
│   │   ├── services/       # jwt, otp, email
│   │   └── utils/
│   ├── database/seeds/     # skill seed data (213 skills)
│   └── server.js
└── frontend/
    └── src/
        ├── api/            # axios wrappers
        ├── components/     # AppLayout, common UI
        ├── pages/          # all route pages
        ├── store/          # zustand stores (auth, notifications, theme)
        └── utils/
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local MongoDB)
- Gmail account for OTP emails (optional — OTP prints to terminal as fallback)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/skillx.git
cd skillx
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run seed           # seeds 213 skills into the database
npm run dev            # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

---

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=at_least_32_characters_long
JWT_REFRESH_SECRET=different_32_character_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (optional — OTP prints to terminal if not set)
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

> **Gmail OTP setup:** Go to Google Account → Security → 2-Step Verification → App Passwords. Generate a 16-character password and use that as `EMAIL_PASS`.

---

## OAuth Setup (optional)

**Google** — [console.cloud.google.com](https://console.cloud.google.com)
- Authorised JS origin: `http://localhost:5000`
- Redirect URI: `http://localhost:5000/api/auth/google/callback`

**GitHub** — [github.com/settings/developers](https://github.com/settings/developers)
- Homepage URL: `http://localhost:5000`
- Callback URL: `http://localhost:5000/api/auth/github/callback`

---

## Creating Your First Account

1. Open `http://localhost:5173/signup`
2. Register with any email
3. If email isn't configured, copy the OTP from the **backend terminal**
4. Complete onboarding — select skills to teach and learn
5. The dashboard will show matched users immediately

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register with email |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-email` | Verify OTP |
| GET  | `/api/recommendations` | Get skill matches |
| GET  | `/api/users/me` | Current user profile |
| GET  | `/api/users/:id` | Any user's profile |
| POST | `/api/sessions` | Book a session |
| PUT  | `/api/sessions/:id/accept` | Accept a session |
| PUT  | `/api/sessions/:id/confirm` | Mark session as done |
| POST | `/api/ratings` | Submit a rating |
| GET  | `/api/chat/:userId` | Get conversation |
| GET  | `/api/skills` | List all skills |

---