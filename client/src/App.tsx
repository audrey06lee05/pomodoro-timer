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

  async function finishSession(completed: boolean, durationSeconds: number) {
    setIsRunning(false);
    accumulatedRef.current = 0;
    setSecondsLeft(DURATION);

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
    } else {
      setIsRunning(true);
    }
  }

  function handleGiveUp() {
    finishSession(false, getElapsedSeconds());
  }

  // Logged out - show the login/register form instead of the app
  if (!token) {
    return (
      <form onSubmit={handleSubmit}>
        <h1>{isRegistering ? "Register" : "Login"}</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <p>{error}</p>}
        <button type="submit">{isRegistering ? "Register" : "Login"}</button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering
            ? "Have an account? Login"
            : "Need an account? Register"}
        </button>
      </form>
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
    <div>
      <nav>
        <button onClick={() => setView("timer")}>Timer</button>
        <button onClick={loadHistory}>History</button>
        <button onClick={loadStats}>Stats</button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setToken(null);
          }}
        >
          Log out
        </button>
      </nav>

      {view === "timer" && (
        <div>
          <h1>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </h1>

          <button onClick={handleStartPause}>
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={handleGiveUp}>Give Up</button>

          {quote && (
            <div>
              <p>"{quote.content}"</p>
              <p>- {quote.author}</p>
            </div>
          )}
        </div>
      )}

      {view === "history" && (
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              {new Date(s.startedAt).toLocaleString()} —{" "}
              {Math.round(s.durationSeconds / 60)} min —{" "}
              {s.completed ? "Completed" : "Abandoned"}
            </li>
          ))}
        </ul>
      )}

      {view === "stats" && stats && (
        <div>
          <p>
            Total focus time this week:{" "}
            {Math.round(stats.totalSecondsThisWeek / 60)} minutes
          </p>
          <p>Current streak: {stats.currentStreak} days</p>
        </div>
      )}
    </div>
  );
}

export default App;
