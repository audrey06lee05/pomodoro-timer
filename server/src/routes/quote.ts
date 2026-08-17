// Proxies a request for a motivational quote to the Quotable API, with a
// small hardcoded fallback list in case that API is unreachable.

import { Router } from "express";

const router = Router();

const FALLBACK_QUOTES = [
  {
    content: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    content: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
  },
  {
    content: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
];

router.get("/", async (req, res) => {
  try {
    const response = await fetch("https://api.quotable.io/random");
    if (!response.ok) throw new Error("Quotable API request failed");

    const data = (await response.json()) as {
      content: string;
      author: string;
    };
    res.json({ content: data.content, author: data.author });
  } catch (err) {
    const random =
      FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    res.json(random);
  }
});

export default router;
