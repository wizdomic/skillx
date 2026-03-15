# Skill Exchange Platform — API Reference

Base URL: `http://localhost:5000/api`

All protected routes require:  `Authorization: Bearer <accessToken>`

All responses follow the envelope:
```json
{
  "success": true | false,
  "message": "Human-readable status",
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

## Authentication  `/api/auth`

### POST `/auth/register`
Register with email + password.
```json
// Request
{ "name": "Alice", "email": "alice@test.com", "password": "Password1" }

// Response 201
{ "success": true, "message": "OTP sent to your email...", "data": { "userId": "..." } }
```

### POST `/auth/verify-email`
Verify email with 6-digit OTP.
```json
// Request
{ "email": "alice@test.com", "otp": "123456" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Alice", "creditBalance": 10 },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST `/auth/login`
```json
// Request
{ "email": "alice@test.com", "password": "Password1" }

// Response 200
{ "success": true, "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }

// Error 401
{ "success": false, "message": "Invalid email or password." }

// Error 423 (account locked)
{ "success": false, "message": "Account temporarily locked..." }
```

### POST `/auth/phone/send-otp`
```json
{ "phone": "+14155552671" }
```

### POST `/auth/phone/verify-otp`
```json
// New user (name required)
{ "phone": "+14155552671", "otp": "456789", "name": "Bob" }

// Existing user
{ "phone": "+14155552671", "otp": "456789" }
```

### POST `/auth/refresh`
```json
// Request
{ "refreshToken": "eyJ..." }

// Response
{ "accessToken": "...", "refreshToken": "..." }
```

### POST `/auth/logout`  🔒
Blacklists the current access token.

### POST `/auth/forgot-password`
```json
{ "email": "alice@test.com" }
```

### POST `/auth/reset-password`
```json
{ "email": "alice@test.com", "otp": "123456", "newPassword": "NewPass1" }
```

### GET `/auth/google`  → Redirects to Google OAuth
### GET `/auth/github`  → Redirects to GitHub OAuth
### GET `/auth/me`  🔒  → Returns current user

---

## Users  `/api/users`

### GET `/users/me`  🔒
Returns full profile with teachSkills and learnSkills arrays.

### PATCH `/users/me`  🔒
```json
{ "name": "Alice Smith", "bio": "...", "location": "NYC", "timezone": "America/New_York" }
```

### POST `/users/me/onboarding`  🔒
Complete onboarding with skills.
```json
{
  "teachSkills": [
    { "skillId": "...", "level": "advanced", "description": "5 years Python" }
  ],
  "learnSkills": [
    { "skillId": "..." }
  ]
}
```

### POST `/users/me/skills`  🔒
Add a single skill.
```json
{ "skillId": "...", "type": "teach", "level": "intermediate", "description": "..." }
```

### DELETE `/users/me/skills/:userSkillId`  🔒

### GET `/users/:userId`  🔒
Public profile view.

---

## Skills  `/api/skills`

### GET `/skills?search=python&category=Programming&page=1&limit=20`
### GET `/skills/categories`  → Array of category strings
### GET `/skills/:skillId`
### POST `/skills`  🔒  (admin: isApproved=true; user: suggestion, isApproved=false)
```json
{ "name": "Docker", "category": "Programming" }
```
### PATCH `/skills/:skillId`  🔒 Admin only
### DELETE `/skills/:skillId`  🔒 Admin only

---

## Sessions  `/api/sessions`

### POST `/sessions`  🔒
Learner requests a session.
```json
{
  "teacherId": "...",
  "skillId": "...",
  "scheduledAt": "2025-03-15T14:00:00.000Z",
  "durationMins": 60,
  "notes": "I want to focus on async/await"
}

// Response 201
{
  "data": {
    "_id": "...",
    "status": "pending",
    "videoLink": null,
    "creditsEligible": true,
    "teacherId": { "name": "Alice", "averageRating": 4.8 },
    ...
  }
}
```

### GET `/sessions?status=pending&role=learner&page=1`  🔒

### GET `/sessions/:sessionId`  🔒

### PUT `/sessions/:sessionId/accept`  🔒
Teacher accepts. Generates Jitsi video link.
```json
// Response
{ "message": "Session accepted.", "data": { "status": "accepted", "videoLink": "https://meet.jit.si/skill-exchange-..." } }
```

### PUT `/sessions/:sessionId/cancel`  🔒
```json
{ "reason": "Schedule conflict" }
```

### PUT `/sessions/:sessionId/confirm`  🔒
Either participant confirms. Credits transfer when BOTH confirm.
```json
// Response when only one confirmed
{ "message": "Your confirmation recorded. Waiting for the other participant." }

// Response when both confirmed + credits eligible
{ "message": "Session confirmed and credits transferred!", "data": { "status": "completed" } }

// Response when limit exceeded
{ "message": "Session confirmed. No credits transferred (weekly limit reached)." }
```

**Anti-abuse rule:**  If a pair completes more than 5 sessions in one calendar week,
`creditsEligible` is set to `false` and no credits are transferred. The session is still
logged normally.

---

## Credits  `/api/credits`

### GET `/credits/wallet?page=1&limit=20&type=earn`  🔒
```json
{
  "data": {
    "balance": 12,
    "transactions": [
      {
        "type": "earn",
        "amount": 1,
        "balanceBefore": 11,
        "balanceAfter": 12,
        "description": "Session payment — 1 credit(s)",
        "createdAt": "2025-03-10T..."
      }
    ]
  },
  "meta": { "page": 1, "total": 5, ... }
}
```

### POST `/credits/admin/adjust`  🔒 Admin only
```json
{ "userId": "...", "amount": 5, "type": "bonus", "description": "Contest winner reward" }
```

---

## Ratings  `/api/ratings`

### POST `/ratings`  🔒
Submit a rating after a completed session.
```json
{ "sessionId": "...", "score": 5, "comment": "Alice is an amazing teacher!" }

// Error 409 if already rated
{ "success": false, "message": "You have already rated this session." }
```

### GET `/ratings/:userId?page=1&limit=20`  🔒
Get all ratings received by a user.

---

## Skill Requests  `/api/requests`

### GET `/requests?type=wanted&skillId=...&page=1`  🔒

### POST `/requests`  🔒
```json
{
  "skillId": "...",
  "type": "wanted",
  "title": "Looking for a Python tutor",
  "description": "I'm a beginner wanting to learn Python for data science..."
}
```

### PATCH `/requests/:requestId`  🔒
```json
{ "status": "fulfilled" }
```

### DELETE `/requests/:requestId`  🔒

---

## Recommendations  `/api/recommendations`

### GET `/recommendations?page=1&limit=10`  🔒
Returns ranked list of potential skill exchange partners.
```json
{
  "data": {
    "matches": [
      {
        "user": { "name": "Bob", "averageRating": 4.5, "totalSessions": 10 },
        "sharedSkillCount": 2,
        "score": 87,
        "teachSkills": [...],
        "learnSkills": [...]
      }
    ]
  }
}
```

**Scoring formula:**  `(sharedSkills × 30) + (rating × 10) + min(sessions, 20)`

---

## Chat  `/api/chat`

### GET `/chat/conversations`  🔒
List all conversation partners with last message + unread count.

### GET `/chat/unread`  🔒
```json
{ "data": { "unreadCount": 3 } }
```

### GET `/chat/:userId?page=1&limit=50`  🔒
Get message history with a specific user. Marks messages as read.

### POST `/chat`  🔒
```json
{ "receiverId": "...", "content": "Hey! I saw you want to learn Python..." }
```

> Real-time delivery is via Socket.IO event `chat:receive`.
> The HTTP endpoint persists to DB; Socket broadcasts immediately.

---

## Socket.IO Events

**Client → Server**
| Event | Payload | Description |
|---|---|---|
| `chat:send` | `{ receiverId, content, tempId }` | Send a chat message |
| `chat:typing` | `{ receiverId }` | Broadcast typing indicator |

**Server → Client**
| Event | Payload | Description |
|---|---|---|
| `chat:receive` | `{ senderId, content, tempId, createdAt }` | Incoming message |
| `chat:typing` | `{ senderId }` | Typing indicator |
| `session:new_request` | `{ sessionId, learnerName, skillName, scheduledAt }` | New session request (teacher) |
| `session:accepted` | `{ sessionId, videoLink }` | Session accepted (learner) |
| `session:cancelled` | `{ sessionId, reason }` | Session cancelled |
| `session:reminder` | `{ sessionId, message, videoLink }` | 1hr before session |
| `session:rate_prompt` | `{ sessionId }` | Prompt to rate after completion |

---

## Error Codes

| HTTP | When |
|---|---|
| 400 | Invalid input / bad OTP |
| 401 | Missing / expired / blacklisted token |
| 402 | Insufficient credits |
| 403 | Forbidden (wrong role or not participant) |
| 404 | Resource not found |
| 409 | Duplicate (email exists, already rated) |
| 422 | Validation failed |
| 423 | Account locked |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
