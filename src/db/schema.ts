import { relations } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Relative rather than the `@/` alias: drizzle-kit and the seed script both
// load this file outside the Next.js compiler, where the alias isn't resolved.
import { STAGES } from "../lib/stages";

/**
 * One row per company/role you are tracking.
 *
 * `position` is a float rather than an integer so a card can be dropped between
 * two others by averaging its neighbours — no need to renumber the column.
 */
export const applications = sqliteTable(
  "applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    company: text("company").notNull(),
    role: text("role").notNull(),
    location: text("location"),
    source: text("source"),
    url: text("url"),
    compensation: text("compensation"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    stage: text("stage", { enum: STAGES }).notNull().default("WISHLIST"),
    /** 1 = high, 2 = medium, 3 = low. */
    priority: integer("priority").notNull().default(2),
    position: real("position").notNull().default(1000),
    appliedAt: integer("applied_at", { mode: "timestamp" }),
    nextActionAt: integer("next_action_at", { mode: "timestamp" }),
    nextActionNote: text("next_action_note"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("applications_stage_idx").on(table.stage),
    index("applications_next_action_idx").on(table.nextActionAt),
    index("applications_archived_idx").on(table.archived),
  ],
);

/** Free-text log entries: what the recruiter said, how the round went, etc. */
export const notes = sqliteTable(
  "notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("notes_application_idx").on(table.applicationId)],
);

/**
 * Append-only record of every stage change.
 *
 * Storing this instead of only the current stage is what makes honest stats
 * possible: once an application is rejected you can still tell whether it was
 * rejected after an interview or ghosted at the resume screen.
 */
export const stageEvents = sqliteTable(
  "stage_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStage: text("from_stage", { enum: STAGES }),
    toStage: text("to_stage", { enum: STAGES }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("stage_events_application_idx").on(table.applicationId)],
);

export const applicationsRelations = relations(applications, ({ many }) => ({
  notes: many(notes),
  stageEvents: many(stageEvents),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  application: one(applications, {
    fields: [notes.applicationId],
    references: [applications.id],
  }),
}));

export const stageEventsRelations = relations(stageEvents, ({ one }) => ({
  application: one(applications, {
    fields: [stageEvents.applicationId],
    references: [applications.id],
  }),
}));

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type StageEvent = typeof stageEvents.$inferSelect;
