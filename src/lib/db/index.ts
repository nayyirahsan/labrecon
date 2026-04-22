import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = `${process.cwd()}/data/labrecon.db`;
const isVercel = process.env.VERCEL === "1";

const sqlite = new Database(dbPath, {
  readonly: isVercel,
  fileMustExist: true,
});

if (!isVercel) {
  sqlite.pragma("journal_mode = WAL");
}
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
