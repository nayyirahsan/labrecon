import {
  index,
  integer,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// ── Supabase auth schema reference ────────────────────────────────────────────

const authSchema = pgSchema("auth");

const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// ── Core tables ───────────────────────────────────────────────────────────────

export const researchers = pgTable(
  "researchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    openalex_id: text("openalex_id").unique().notNull(),
    name: text("name").notNull(),
    title: text("title"),
    department: text("department"),
    email: text("email"),
    profile_url: text("profile_url"),
    research_summary: text("research_summary"),
    embedding: vector("embedding", { dimensions: 1024 }),
    last_updated_at: timestamp("last_updated_at").defaultNow(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("researchers_embedding_idx")
      .using("ivfflat", t.embedding.op("vector_cosine_ops"))
      .with({ lists: 50 }),
  ]
);

export const publications = pgTable("publications", {
  id: uuid("id").primaryKey().defaultRandom(),
  researcher_id: uuid("researcher_id").references(() => researchers.id, {
    onDelete: "cascade",
  }),
  openalex_id: text("openalex_id").unique(),
  title: text("title").notNull(),
  abstract: text("abstract"),
  venue: text("venue"),
  year: integer("year"),
  doi: text("doi"),
  cited_by_count: integer("cited_by_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

export const grants = pgTable("grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  researcher_id: uuid("researcher_id").references(() => researchers.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  funder: text("funder"),
  amount: text("amount"),
  year: integer("year"),
  created_at: timestamp("created_at").defaultNow(),
});

export const user_profiles = pgTable("user_profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  major: text("major"),
  year: text("year"),
  skills: text("skills"),
  interests: text("interests"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const tracker_entries = pgTable("tracker_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => authUsers.id, {
    onDelete: "cascade",
  }),
  researcher_id: uuid("researcher_id").references(() => researchers.id, {
    onDelete: "cascade",
  }),
  status: text("status").notNull().default("saved"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const email_generations = pgTable("email_generations", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => authUsers.id, {
    onDelete: "cascade",
  }),
  researcher_id: uuid("researcher_id").references(() => researchers.id, {
    onDelete: "cascade",
  }),
  generated_at: timestamp("generated_at").defaultNow(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type Researcher = typeof researchers.$inferSelect;
export type NewResearcher = typeof researchers.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type NewPublication = typeof publications.$inferInsert;
export type Grant = typeof grants.$inferSelect;
export type NewGrant = typeof grants.$inferInsert;
export type UserProfile = typeof user_profiles.$inferSelect;
export type TrackerEntry = typeof tracker_entries.$inferSelect;
export type TrackerStatus = "saved" | "sent" | "responded" | "no_response" | "meeting";
export type EmailGeneration = typeof email_generations.$inferSelect;
