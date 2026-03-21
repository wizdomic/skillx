# SkillX — Peer-to-Peer Skill Exchange Platform

Teach what you know. Learn what you love. A credit-based skill exchange where every session you teach earns 1 credit to spend on learning.

## Stack

**Backend** — Node.js · Express · MongoDB · Socket.IO · JWT  
**Frontend** — React · Vite · TailwindCSS · Zustand

## Features

- 🔐 Email/OTP auth + Google & GitHub OAuth
- 🤝 Skill-based matchmaking (ranked by shared skills & rating)
- 📅 Session booking → accept → set meeting link → confirm
- 💬 Real-time chat with message delete and conversation delete
- 🪙 Credit wallet — hold on booking, refund on cancel, settle on complete
- ⭐ Ratings & reviews after sessions
- 📋 Public skill request board
- 🌙 Dark / light mode
- 🔔 In-app notifications (session events, messages)

## Quick Start

```bash
# Backend
cd backend && npm install
cp .env.example .env   # fill in values
npm run seed           # seeds 213 skills
npm run dev            # http://localhost:5000

# Frontend
cd frontend && npm install
cp .env.example .env   # set VITE_SOCKET_URL
npm run dev            # http://localhost:5173
```

## Deploy

**Backend → [Railway](https://railway.app)**  
**Frontend → [Vercel](https://vercel.com)**

Required env vars on Railway:
```
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ random chars>
JWT_REFRESH_SECRET=<different 32+ chars>
```

Required env vars on Vercel:
```
VITE_API_URL=https://your-app.railway.app/api
VITE_SOCKET_URL=https://your-app.railway.app
```

See `backend/.env.example` and `frontend/.env.example` for full list.

## First Account

1. Visit `/signup` — register with any email
2. If email not configured, OTP prints to **backend terminal**
3. Complete onboarding — select skills to teach and learn
4. Dashboard shows matched users instantly
