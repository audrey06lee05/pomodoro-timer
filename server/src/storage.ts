// Read/write helpers for our JSON-file "database" - every route reads a file into
// memory, does normal array logic (.find/.filter/.push), then writes it back.

import { promises as fs } from "fs";
import path from "path";

function dataPath(filename: string): string {
  return path.join(__dirname, "..", "data", filename);
}

export async function readJson<T>(filename: string): Promise<T> {
  try {
    const filePath = dataPath(filename);
    const data = await fs.readFile(filePath, "utf-8");

    return JSON.parse(data) as T;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return [] as unknown as T;
    }
    throw err;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  const filePath = dataPath(filename);
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, "utf-8");
}
