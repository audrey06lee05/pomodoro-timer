// Centralizes all calls to our backend, including attaching the JWT to
// protected requests. App.tsx calls these functions instead of using
// fetch() directly.

const BASE_URL = "http://localhost:3001/api";

export async function register(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data as { token: string; user: { id: string; email: string } };
}

export async function login(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data as { token: string; user: { id: string; email: string } };
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function createSession(
  token: string,
  durationSeconds: number,
  completed: boolean,
) {
  const response = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ durationSeconds, completed }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to save session");
  }

  return data;
}

export async function getQuote() {
  const response = await fetch(`${BASE_URL}/quote`);
  const data = await response.json();
  return data as { content: string; author: string };
}

export async function getSessions(token: string) {
  const response = await fetch(`${BASE_URL}/sessions`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load sessions");
  }

  return data;
}

export async function getStats(token: string) {
  const response = await fetch(`${BASE_URL}/sessions/stats`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load stats");
  }

  return data;
}
