import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

function getDb(): DrizzleDb {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
