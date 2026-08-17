// Register and login routes - creates JWTs on success so the client can
// attach them to future requests as proof of being logged in.

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "../storage";
import { User } from "../types";

const router = Router();
const USERS_FILE = "users.json";
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET as string;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  // Register Checks
  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .json({ error: "Please provide a valid email address" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  const users = await readJson<User[]>(USERS_FILE);
  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res
      .status(409)
      .json({ error: "An account with that email already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser: User = {
    id: randomUUID(),
    email,
    hashedPassword,
  };

  users.push(newUser);
  await writeJson(USERS_FILE, users);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);

  res
    .status(201)
    .json({ token, user: { id: newUser.id, email: newUser.email } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = await readJson<User[]>(USERS_FILE);
  const existing = users.find((u) => u.email === email);
  if (!existing) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, existing.hashedPassword);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: existing.id }, JWT_SECRET);

  res.json({ token, user: { id: existing.id, email: existing.email } });
});

export default router;
