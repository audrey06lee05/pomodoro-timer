# ⏱️ Focus Timer with Session History

✨ A Pomodoro-style focus timer that persists sessions to a real backend, so your focus history follows you across logins instead of disappearing on refresh.

Every completed session is saved under your account, rewarded with a motivational quote, and logged to your personal history and stats. Authentication is handled with JWTs and hashed passwords, and the countdown itself is built on the Performance API rather than a naive `setInterval`, so long sessions don't drift off the real clock.

Built with a React + TypeScript frontend and a Node.js + Express + TypeScript backend, using JSON files as a lightweight "database" and the Quotable API for motivational quotes.

## 🗣️ Languages & Technologies

- React 19 + TypeScript
- Node.js, Express 5, and TypeScript
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- JSON files as the data store (no database, no ORM)
- Quotable API for motivational quotes, with a hardcoded fallback
- Vite for frontend development and production builds
- ESLint for code-quality checks

## ⚜️ Key Features

- **Account-based persistence** — register and log in with email and password; every focus session is saved under your own account and survives across logins and devices
- **Drift-free timer** — start, pause, and resume a 25-minute focus session using `performance.now()` to track real elapsed time, rather than trusting `setInterval` tick counts
- **Refresh-safe sessions** — an in-progress or paused timer is restored correctly if the page is refreshed, instead of resetting to 25:00
- **Reward on completion** — finishing a session plays a short alert tone and fetches a motivational quote to display alongside the result
- **Abandon tracking** — giving up early logs the session as abandoned (with the time actually spent) instead of discarding it
- **Session history** — a list of past sessions, showing date, duration, and whether each was completed or abandoned, filtered to the logged-in user
- **Stats view** — total focus time in the last 7 days and the current daily streak, calculated from your session history
- **Input validation** — email format, minimum password length, and duplicate-email checks are enforced on the backend, not just the UI
- **Resilient quote fetching** — if the external Quotable API is unreachable, the backend transparently falls back to a small built-in quote list
- **Responsive, dark-themed UI** — adapts to smaller screens down to mobile widths

## 🏗️ Architecture

| File / Module | Responsibility |
|---|---|
| `server/src/types.ts` | Shared `User` and `Session` type definitions used across the backend |
| `server/src/storage.ts` | Typed `readJson`/`writeJson` helpers wrapping `fs.readFile`/`fs.writeFile` |
| `server/src/middleware/auth.ts` | `requireAuth` — verifies the JWT on protected routes and attaches `userId` to the request |
| `server/src/routes/auth.ts` | `POST /register` and `POST /login` — validation, password hashing, JWT issuing |
| `server/src/routes/sessions.ts` | `POST/GET /sessions` and `GET /sessions/stats` — session CRUD and weekly total/streak calculation |
| `server/src/routes/quote.ts` | `GET /quote` — proxies the Quotable API with a fallback quote list |
| `server/src/env.ts` | Loads `.env` before any other module needs `process.env` |
| `server/src/index.ts` | Express app entry point — middleware, route mounting, server startup |
| `client/src/api.ts` | Centralizes every backend call, including attaching the JWT to protected requests |
| `client/src/App.tsx` | Main component — auth form, timer, history, and stats views, switched by local state |

### Architecture Decisions

- **JSON files instead of a database** — `data/users.json` and `data/sessions.json` act as flat-file "tables." Every route reads the relevant file into memory, does its work with `find`/`filter`/`push`, and writes it back — the same CRUD logic you'd write against a real database, without introducing a query language.
- **JWT stored in both React state and `localStorage`** — state drives what the UI renders, while `localStorage` lets the session survive a page refresh instead of forcing a re-login every time.
- **`performance.now()`-based timer** — each tick recalculates remaining time from the actual elapsed wall-clock time since the timer started, rather than counting down by one each interval. This makes the countdown self-correcting instead of accumulating drift over a long session.
- **Timer state persisted via absolute timestamps** — resuming a timer after a refresh uses `Date.now()` (real calendar time) rather than `performance.now()` (which resets on every page load), so the remaining time is calculated correctly even after the page reloads.
- **Backend proxies the quote API with a fallback** — the Quotable API has a known history of intermittent downtime, so the fallback list guarantees a session always ends with a quote, even if the third-party API is unreachable.
- **Validation lives on the backend** — email format, password length, and duplicate-email checks are enforced server-side, since client-side checks alone can be bypassed.
- **Centralized `api.ts` layer** — every fetch call and its JWT header lives in one file, so `App.tsx` stays focused on UI and state rather than repeating request boilerplate.

## 🌐 Live Demo

Not currently deployed — see **Running Locally** below.

## 🔧 Running Locally (for Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/audrey06lee05/pomodoro-timer.git
   ```
2. Enter the project directory:
   ```bash
   cd pomodoro-timer
   ```
3. Set up the backend:
   ```bash
   cd server
   npm install
   ```
4. Create a `.env` file inside `server/` with:
   ```
   PORT=3001
   JWT_SECRET="your-own-secret-string"
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```
6. In a separate terminal, set up the frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```
7. Open the local URL shown in the terminal, usually `http://localhost:5173`.

## ✅ Quality Checks

Run the frontend linter:
```bash
cd client
npm run lint
```
Create a production build of the frontend:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```
Build the backend for production:
```bash
cd server
npm run build
```

## 📌 How to Use

#### 🔑 Create an Account
1. On the welcome screen, switch to **Register** and enter an email and password (minimum 6 characters)
2. You're automatically logged in after registering

#### ⏳ Run a Focus Session
1. From the **Timer** tab, press **Start** to begin a 25-minute session
2. Press **Pause**/**Start** to pause and resume as needed
3. Let the timer run out to complete the session, or press **Give Up** to end it early
4. A completed session plays a short tone and shows a motivational quote

#### 📖 Review Your History and Stats
- Open the **History** tab to see every past session, with date, duration, and completed/abandoned status
- Open the **Stats** tab to see your total focus time over the last 7 days and your current daily streak
