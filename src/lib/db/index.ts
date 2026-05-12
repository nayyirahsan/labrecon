import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

function getDb(): DrizzleDb {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!);
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
