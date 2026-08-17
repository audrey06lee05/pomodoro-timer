// Session CRUD + stats routes - mounted behind requireAuth in index.ts, so
// req.userId is always set here already. Every route filters sessions.json
// down to just this user's entries.

import { Router } from "express";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "../storage";
import { Session } from "../types";

const router = Router();
const SESSIONS_FILE = "sessions.json";

router.post("/", async (req, res) => {
  const { durationSeconds, completed, startedAt } = req.body;

  const sessions = await readJson<Session[]>(SESSIONS_FILE);

  const newSession: Session = {
    id: randomUUID(),
    userId: req.userId!,
    startedAt:
      typeof startedAt === "string" ? startedAt : new Date().toISOString(),
    durationSeconds,
    completed,
  };

  sessions.push(newSession);
  await writeJson(SESSIONS_FILE, sessions);

  res.status(201).json(newSession);
});

router.get("/", async (req, res) => {
  const sessions = await readJson<Session[]>(SESSIONS_FILE);

  const mine = sessions
    .filter((s) => s.userId === req.userId)
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

  res.json(mine);
});

router.get("/stats", async (req, res) => {
  const sessions = await readJson<Session[]>(SESSIONS_FILE);
  const mine = sessions.filter((s) => s.userId === req.userId && s.completed);

  const now = new Date();
  const startOfTodayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const sevenDaysAgoUTC = new Date(startOfTodayUTC);
  sevenDaysAgoUTC.setUTCDate(sevenDaysAgoUTC.getUTCDate() - 6);

  // Sum this user's completed sessions from the last 7 days
  const totalSecondsThisWeek = mine
    .filter((s) => new Date(s.startedAt) >= sevenDaysAgoUTC)
    .reduce((sum, s) => sum + s.durationSeconds, 0);

  // Count consecutive days (ending today) with at least one completed session
  const daysWithSessions = new Set(
    mine.map((s) => {
      const d = new Date(s.startedAt);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    }),
  );

  let currentStreak = 0;
  const cursor = new Date(startOfTodayUTC);

  while (
    daysWithSessions.has(
      `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`,
    )
  ) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  res.json({ totalSecondsThisWeek, currentStreak });
});

export default router;
