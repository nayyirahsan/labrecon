import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const labs = sqliteTable("labs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  piName: text("pi_name").notNull(),
  piTitle: text("pi_title").notNull(),
  department: text("department").notNull(),
  college: text("college").notNull(),
  labName: text("lab_name").notNull(),
  researchSummary: text("research_summary").notNull(),
  labWebsite: text("lab_website"),
  email: text("email"),
  skills: text("skills").notNull().default("[]"), // JSON string[]
  activityScore: integer("activity_score").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const publications = sqliteTable("publications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  labId: integer("lab_id")
    .notNull()
    .references(() => labs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors").notNull(), // comma-separated
  year: integer("year").notNull(),
  venue: text("venue").notNull(),
  url: text("url"),
  abstract: text("abstract"),
});

export const grants = sqliteTable("grants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  labId: integer("lab_id")
    .notNull()
    .references(() => labs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  funder: text("funder").notNull(),
  amount: integer("amount"), // in USD
  startDate: text("start_date"), // ISO date string
  endDate: text("end_date"),
});

// status: saved | sent | responded | no_response | meeting
export const trackerEntries = sqliteTable("tracker_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(), // anonymous UUID from localStorage
  labId: integer("lab_id")
    .notNull()
    .references(() => labs.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("saved"),
  dateSent: text("date_sent"), // ISO date string
  lastUpdated: integer("last_updated", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  notes: text("notes"),
});

export type Lab = typeof labs.$inferSelect;
export type NewLab = typeof labs.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type Grant = typeof grants.$inferSelect;
export type TrackerEntry = typeof trackerEntries.$inferSelect;
export type TrackerStatus = "saved" | "sent" | "responded" | "no_response" | "meeting";
