// Main app component: shows the login/register form when logged out, and
// the timer/history/stats views once a token exists. Token is kept in both
// React state (drives the UI) and localStorage (survives a page refresh).

import { useState, useEffect } from "react";
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

  return <div>Logged in! Token: {token}</div>;
}

export default App;
