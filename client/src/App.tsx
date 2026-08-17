// Main app component: shows the login/register form when logged out, and
// the timer/history/stats views once a token exists. Token is kept in both
// React state (drives the UI) and localStorage (survives a page refresh).

import { useState, useEffect, useRef } from "react";
import {
  register,
  login,
  createSession,
  getSessions,
  getStats,
  getQuote,
} from "./api";
import "./App.css";

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const DURATION = 25 * 60; // 25 minutes, in seconds

  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const [view, setView] = useState<"timer" | "history" | "stats">("timer");
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalSecondsThisWeek: number;
    currentStreak: number;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const data = isRegistering
        ? await register(email, password)
        : await login(email, password);

      setToken(data.token);
      localStorage.setItem("token", data.token);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = performance.now();

    const intervalId = setInterval(() => {
      const elapsedSinceStart =
        (performance.now() - startTimeRef.current!) / 1000;
      const totalElapsed = accumulatedRef.current + elapsedSinceStart;
      const remaining = Math.max(0, DURATION - totalElapsed);

      setSecondsLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        finishSession(true, DURATION);
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Runs once on page load - restores an in-progress or paused timer from
  // localStorage, so refreshing the page doesn't lose your session.
  useEffect(() => {
    if (!token) return;

    const savedEndAt = localStorage.getItem("timerEndAt");
    const savedAccumulated = localStorage.getItem("timerAccumulated");

    if (savedEndAt) {
      const remainingMs = Number(savedEndAt) - Date.now();
      if (remainingMs <= 0) {
        finishSession(true, DURATION);
      } else {
        const remainingSeconds = remainingMs / 1000;
        accumulatedRef.current = DURATION - remainingSeconds;
        setSecondsLeft(Math.ceil(remainingSeconds));
        setIsRunning(true);
      }
    } else if (savedAccumulated) {
      accumulatedRef.current = Number(savedAccumulated);
      setSecondsLeft(Math.ceil(DURATION - Number(savedAccumulated)));
    }
  }, []);

  const [quote, setQuote] = useState<{
    content: string;
    author: string;
  } | null>(null);

  function getElapsedSeconds() {
    if (!isRunning || startTimeRef.current === null)
      return accumulatedRef.current;
    return (
      accumulatedRef.current + (performance.now() - startTimeRef.current) / 1000
    );
  }

  function saveTimerState(running: boolean, remainingSeconds: number) {
    if (running) {
      localStorage.setItem(
        "timerEndAt",
        String(Date.now() + remainingSeconds * 1000),
      );
      localStorage.removeItem("timerAccumulated");
    } else {
      localStorage.setItem(
        "timerAccumulated",
        String(DURATION - remainingSeconds),
      );
      localStorage.removeItem("timerEndAt");
    }
  }

  function clearTimerState() {
    localStorage.removeItem("timerEndAt");
    localStorage.removeItem("timerAccumulated");
  }

  async function finishSession(completed: boolean, durationSeconds: number) {
    setIsRunning(false);
    accumulatedRef.current = 0;
    setSecondsLeft(DURATION);
    clearTimerState();

    await createSession(token!, Math.round(durationSeconds), completed);

    if (completed) {
      const q = await getQuote();
      setQuote(q);
    }
  }

  function handleStartPause() {
    if (isRunning) {
      accumulatedRef.current +=
        (performance.now() - startTimeRef.current!) / 1000;
      setIsRunning(false);
      saveTimerState(false, DURATION - accumulatedRef.current);
    } else {
      setIsRunning(true);
      saveTimerState(true, secondsLeft);
    }
  }

  function handleGiveUp() {
    finishSession(false, getElapsedSeconds());
  }

  // Logged out - show the login/register form instead of the app
  if (!token) {
    return (
      <div className="auth-screen">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Focus Timer</h1>
          <p className="auth-subtitle">
            {isRegistering ? "Create an account" : "Welcome back"}
          </p>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit">
            {isRegistering ? "Register" : "Login"}
          </button>
          <button
            className="btn-link"
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering
              ? "Have an account? Login"
              : "Need an account? Register"}
          </button>
        </form>
      </div>
    );
  }

  async function loadHistory() {
    const data = await getSessions(token!);
    setSessions(data);
    setView("history");
  }

  async function loadStats() {
    const data = await getStats(token!);
    setStats(data);
    setView("stats");
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="app">
      <nav className="nav">
        <button
          className={`nav-btn ${view === "timer" ? "active" : ""}`}
          onClick={() => setView("timer")}
        >
          Timer
        </button>
        <button
          className={`nav-btn ${view === "history" ? "active" : ""}`}
          onClick={loadHistory}
        >
          History
        </button>
        <button
          className={`nav-btn ${view === "stats" ? "active" : ""}`}
          onClick={loadStats}
        >
          Stats
        </button>
        <button
          className="nav-btn logout"
          onClick={() => {
            localStorage.removeItem("token");
            setToken(null);
          }}
        >
          Log out
        </button>
      </nav>

      <main className="content">
        {view === "timer" && (
          <div className="timer-view">
            <div className="timer-display">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>

            <div className="timer-controls">
              <button className="btn btn-primary" onClick={handleStartPause}>
                {isRunning ? "Pause" : "Start"}
              </button>
              <button className="btn btn-secondary" onClick={handleGiveUp}>
                Give Up
              </button>
            </div>

            {quote && (
              <div className="quote-card">
                <p className="quote-text">"{quote.content}"</p>
                <p className="quote-author">— {quote.author}</p>
              </div>
            )}
          </div>
        )}

        {view === "history" && (
          <ul className="history-list">
            {sessions.length === 0 && (
              <p className="empty-state">
                No sessions yet — start your first one!
              </p>
            )}
            {sessions.map((s) => (
              <li
                key={s.id}
                className={`history-item ${s.completed ? "completed" : "abandoned"}`}
              >
                <span className="history-date">
                  {new Date(s.startedAt).toLocaleString()}
                </span>
                <span className="history-duration">
                  {Math.round(s.durationSeconds / 60)} min
                </span>
                <span className="history-status">
                  {s.completed ? "Completed" : "Abandoned"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {view === "stats" && stats && (
          <div className="stats-view">
            <div className="stat-card">
              <span className="stat-value">
                {Math.round(stats.totalSecondsThisWeek / 60)}
              </span>
              <span className="stat-label">minutes this week</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.currentStreak}</span>
              <span className="stat-label">day streak</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
