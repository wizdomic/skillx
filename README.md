# SkillX — Skill Exchange Platform MVP

A full-stack credit-based skill exchange platform. Teach what you know, learn what you love. No money changes hands — only credits.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + Zustand + Socket.IO client |
| Backend | Node.js + Express + MongoDB (Mongoose) + Redis + Socket.IO |
| Auth | JWT (access + refresh), bcrypt, Passport (Google + GitHub OAuth), OTP via Twilio / email |
| Realtime | Socket.IO (chat, session events, reminders) |
| Jobs | node-cron (session reminders every 15min) |

---

## Quick Start

### 1. Start MongoDB & Redis
```bash
# With Docker:
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env       # fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL
npm run seed               # seed 38 skills + 3 test users
npm run dev                # → http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                # → http://localhost:5173
```

---

## Test Accounts (after seeding)

| Email | Password | Teaches | Wants to Learn |
|---|---|---|---|
| alice@example.com | Password1 | Python, React | Guitar, Spanish |
| bob@example.com | Password1 | Guitar, Figma | Python, French |
| priya@example.com | Password1 | Hindi, Spanish | React, Piano |

---

## Features

- ✅ Email + Phone OTP + Google/GitHub OAuth
- ✅ 4-step onboarding with skill selection
- ✅ AI-powered matchmaking (scoring by shared skills + rating + sessions)
- ✅ Session booking, accept, cancel, confirm flow
- ✅ Credit wallet (atomic transfers, anti-abuse: max 5 credited sessions/pair/week)
- ✅ Real-time chat with Socket.IO
- ✅ Session reminders (cron job, 1hr before)
- ✅ Star ratings + rolling average
- ✅ Skill request board (offer / wanted)
- ✅ JWT refresh token rotation + Redis blacklist

---

## Project Structure

```
skill-exchange-mvp/
├── backend/
│   ├── src/
│   │   ├── config/         # db, redis, socket, passport, env
│   │   ├── middleware/      # authenticate, authorize, rateLimiter, antiAbuse, errorHandler
│   │   ├── models/         # 8 Mongoose models
│   │   ├── modules/        # auth, users, skills, sessions, credits, ratings, requests, recommendations, chat
│   │   ├── services/       # jwt, otp, email, sms
│   │   ├── jobs/           # sessionReminder cron
│   │   └── utils/          # apiResponse, asyncHandler, paginate
│   ├── database/seeds/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/            # axios clients for all endpoints
    │   ├── components/     # AppLayout, common UI components
    │   ├── context/        # SocketContext
    │   ├── pages/          # 15 pages
    │   ├── routes/         # AppRouter with protected/public guards
    │   ├── store/          # Zustand: auth, notifications
    │   └── utils/          # axiosInstance with JWT refresh
    ├── index.html
    └── package.json
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/skill_exchange
REDIS_URL=redis://localhost:6379
JWT_SECRET=<32+ char secret>
JWT_REFRESH_SECRET=<32+ char secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
# Optional — degrade gracefully in dev:
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=...
EMAIL_PASS=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SIGNUP_CREDIT_BONUS=10
MAX_SESSIONS_PER_PAIR_PER_WEEK=5
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
# skillx
# skillx
# skillx
# skillx
# skillx
