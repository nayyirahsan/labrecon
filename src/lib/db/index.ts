import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined
}

const client = globalForDb.client ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  prepare: false,
})

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client
}

export const db = drizzle(client, { schema })
