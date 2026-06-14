# CleanCoder AI

> AI-powered code correction, error detection, and optimization platform built with React, Node.js, MongoDB Atlas, Firebase, and Google Gemini.

![CleanCoder AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?style=flat-square&logo=google) ![Node](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js) ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)

---

## Features

- **AI Code Analysis** — Google Gemini detects syntax errors, logical bugs, runtime issues, and style problems
- **Multi-language Support** — C, C++, Java, Python, JavaScript, TypeScript, PHP, Go
- **Monaco Editor** — VS Code-like editing experience with syntax highlighting
- **Code Diff View** — Side-by-side comparison of original vs corrected code
- **Quality Score** — 0–100 quality rating with time/space complexity analysis
- **PDF Reports** — Downloadable professional analysis reports
- **History** — Save, search, filter, and re-analyze past submissions
- **Role-based Auth** — JWT authentication with admin panel
- **Dark/Light Mode** — System-aware theme with toggle
- **Firebase Analytics** — Real-time usage tracking via Firestore

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS      |
| Code Editor | Monaco Editor                     |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB Atlas                     |
| Analytics   | Firebase Firestore                |
| AI          | Google Gemini 1.5 Flash           |
| Auth        | JWT + bcrypt                      |
| PDF         | PDFKit                            |

---

## Project Structure

```
cleancoder/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth + Theme contexts
│   │   ├── pages/             # Page components
│   │   └── utils/             # API client + helpers
│   └── package.json
├── server/                    # Express.js backend
│   ├── controllers/           # Route handlers
│   ├── middleware/            # Auth, upload, rate limiting
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API route definitions
│   ├── services/              # Gemini AI, PDF, Firebase
│   └── package.json
├── firebase.json
├── firestore.rules
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key
- Firebase project (optional — for analytics)

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

**Server** — copy `server/.env.example` to `server/.env` and fill in:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
GEMINI_API_KEY=AIza...
FIREBASE_PROJECT_ID=...   (optional)
```

**Client** — copy `client/.env.example` to `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint                        | Auth     | Description              |
|--------|---------------------------------|----------|--------------------------|
| POST   | /api/auth/register              | None     | Create account           |
| POST   | /api/auth/login                 | None     | Login                    |
| GET    | /api/auth/me                    | JWT      | Get profile              |
| PUT    | /api/auth/profile               | JWT      | Update profile           |
| POST   | /api/ai/analyze                 | Optional | Analyze code with AI     |
| GET    | /api/submissions                | JWT      | Get submission history   |
| GET    | /api/submissions/stats          | JWT      | Get analysis stats       |
| DELETE | /api/submissions/:id            | JWT      | Delete submission        |
| POST   | /api/reports/generate/:id       | JWT      | Generate PDF report      |
| GET    | /api/reports/download/:id       | JWT      | Download PDF             |
| GET    | /api/admin/stats                | Admin    | Platform statistics      |
| GET    | /api/admin/users                | Admin    | Manage users             |

---

## Making a User Admin

Connect to MongoDB Atlas and run:
```javascript
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## License

MIT
