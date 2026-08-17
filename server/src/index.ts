// Entry point: creates the Express app, wires up middleware and all three
// route files, and starts the server listening on PORT.

import "./env";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import sessionRoutes from "./routes/sessions";
import quoteRoutes from "./routes/quote";
import { requireAuth } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sessions", requireAuth, sessionRoutes);
app.use("/api/quote", quoteRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
