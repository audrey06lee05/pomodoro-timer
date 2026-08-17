// Shared shapes for the two "tables" (users.json and sessions.json) used across the whole backend.

export interface User {
  id: string;
  email: string;
  hashedPassword: string;
}

export interface Session {
  id: string;
  userId: string;
  startedAt: string;
  durationSeconds: number;
  completed: boolean;
}
