# Skill Exchange Platform — Backend

Node.js + Express + MongoDB + Redis + Socket.IO

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
# Minimum required: MONGODB_URI, JWT_SECRET (32+ chars), JWT_REFRESH_SECRET (32+ chars), CLIENT_URL
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Start development server
```bash
npm run dev
```

Server starts on `http://localhost:5000`

---

## Project Structure

```
src/
├── config/          # DB, Redis, Socket.IO, Passport, env validation
├── middleware/       # Auth, RBAC, rate limiter, anti-abuse, error handler
├── models/          # Mongoose schemas
├── modules/         # Feature modules (auth, users, skills, sessions, ...)
│   └── {module}/
│       ├── *.routes.js
│       ├── *.controller.js
│       └── *.service.js
├── services/        # Shared services (JWT, OTP, email, SMS)
├── utils/           # Helpers (apiResponse, asyncHandler, paginate)
└── jobs/            # Cron jobs
```

---

## Key Design Decisions

### Credit Anti-Abuse
- Max **5 credited sessions per pair per calendar week**
- Sessions 6+ still happen but `creditsEligible = false`
- Enforced at `PUT /sessions/:id/confirm` via `Session.countPairSessionsThisWeek()`

### Double-Confirmation Credits
- Credits only transfer when **both** teacher AND learner confirm the session completed
- Uses MongoDB transactions for atomic balance updates

### Account Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens expire in 7 days; refresh tokens in 30 days
- Logout blacklists the access token in Redis
- 5 failed login attempts = 15-minute lockout
- OTPs expire in 10 minutes; max 5 verification attempts

### Real-Time
- Socket.IO rooms: `user:{userId}` (private per user)
- Authentication via JWT in `socket.handshake.auth.token`

---

## Test Accounts (after seeding)
| Email | Password | Teaches | Wants to Learn |
|---|---|---|---|
| alice@example.com | Password1 | Python, React | Guitar, Spanish |
| bob@example.com | Password1 | Guitar, Figma | Python, French |
| priya@example.com | Password1 | Hindi, Spanish | React, Piano |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | Min 32 chars |
| `CLIENT_URL` | ✅ | Frontend URL for CORS + OAuth redirect |
| `REDIS_URL` | ❌ | Defaults to `redis://localhost:6379` |
| `EMAIL_*` | ❌ | Nodemailer config (falls back to console log) |
| `GOOGLE_*` | ❌ | Google OAuth |
| `GITHUB_*` | ❌ | GitHub OAuth |

All optional services degrade gracefully in development — emails and SMS are logged to console.
