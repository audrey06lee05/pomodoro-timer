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
