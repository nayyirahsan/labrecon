import Database from "better-sqlite3";
import { existsSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const isVercel = process.env.VERCEL === "1";
const dbPathCandidates = [
  path.join(process.cwd(), "data", "labrecon.db"),
  path.join(process.cwd(), ".next", "server", "data", "labrecon.db"),
  "/var/task/data/labrecon.db",
];
const dbPath = dbPathCandidates.find((candidate) => existsSync(candidate));

if (!dbPath) {
  throw new Error(
    `SQLite database not found. Checked: ${dbPathCandidates.join(", ")}`
  );
}

const sqlite = new Database(dbPath, {
  readonly: isVercel,
  fileMustExist: true,
});

if (!isVercel) {
  sqlite.pragma("journal_mode = WAL");
}
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
