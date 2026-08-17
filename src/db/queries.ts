import { and, asc, count, desc, eq, inArray, lte, ne, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { applications, notes, stageEvents } from "@/db/schema";
import { RESPONDED_STAGES, STAGES, type Stage } from "@/lib/stages";
import { addDays, today } from "@/lib/dates";

export type BoardApplication = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  stage: Stage;
  priority: number;
  position: number;
  appliedAt: Date | null;
  nextActionAt: Date | null;
  nextActionNote: string | null;
  updatedAt: Date;
  noteCount: number;
};

/**
 * Everything on the board, in one round trip per table.
 *
 * The note counts come from a separate grouped query rather than a join,
 * because joining a one-to-many and then counting would duplicate application
 * rows and inflate the numbers.
 */
export async function getBoardApplications(): Promise<BoardApplication[]> {
  const db = await getDb();

  const [rows, counts] = await Promise.all([
    db
      .select({
        id: applications.id,
        company: applications.company,
        role: applications.role,
        location: applications.location,
        url: applications.url,
        stage: applications.stage,
        priority: applications.priority,
        position: applications.position,
        appliedAt: applications.appliedAt,
        nextActionAt: applications.nextActionAt,
        nextActionNote: applications.nextActionNote,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(eq(applications.archived, false))
      .orderBy(asc(applications.priority), asc(applications.position)),
    db
      .select({ applicationId: notes.applicationId, total: count() })
      .from(notes)
      .groupBy(notes.applicationId),
  ]);

  const countByApplication = new Map(counts.map((row) => [row.applicationId, row.total]));

  return rows.map((row) => ({
    ...row,
    noteCount: countByApplication.get(row.id) ?? 0,
  }));
}

export async function getApplication(id: string) {
  const db = await getDb();

  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  if (!application) return null;

  const [noteList, history] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(eq(notes.applicationId, id))
      .orderBy(desc(notes.createdAt)),
    db
      .select()
      .from(stageEvents)
      .where(eq(stageEvents.applicationId, id))
      .orderBy(desc(stageEvents.createdAt)),
  ]);

  return { application, notes: noteList, history };
}

/** Anything whose next action is due today or already overdue. */
export async function getFollowUps(): Promise<BoardApplication[]> {
  const all = await getBoardApplications();
  const cutoff = addDays(today(), 1);

  return all
    .filter(
      (row) =>
        row.stage !== "REJECTED" &&
        row.nextActionAt !== null &&
        row.nextActionAt < cutoff,
    )
    .sort((a, b) => a.nextActionAt!.getTime() - b.nextActionAt!.getTime());
}

export type Stats = {
  active: number;
  byStage: Record<Stage, number>;
  everApplied: number;
  everResponded: number;
  responseRate: number | null;
  staleCount: number;
};

/**
 * Response rate is measured from the stage-event log, not the current stage.
 * An application sitting in "Rejected" today may still have reached an
 * interview, and that should count as a response.
 */
export async function getStats(): Promise<Stats> {
  const db = await getDb();

  const [stageCounts, everApplied, everResponded, stale] = await Promise.all([
    db
      .select({ stage: applications.stage, total: count() })
      .from(applications)
      .where(eq(applications.archived, false))
      .groupBy(applications.stage),

    db
      .select({ total: sql<number>`count(distinct ${stageEvents.applicationId})` })
      .from(stageEvents)
      .where(inArray(stageEvents.toStage, ["APPLIED", ...RESPONDED_STAGES])),

    db
      .select({ total: sql<number>`count(distinct ${stageEvents.applicationId})` })
      .from(stageEvents)
      .where(inArray(stageEvents.toStage, RESPONDED_STAGES)),

    // "Stale" = still sitting in Applied with no movement for three weeks.
    // These are the ones worth nudging.
    db
      .select({ total: count() })
      .from(applications)
      .where(
        and(
          eq(applications.archived, false),
          eq(applications.stage, "APPLIED"),
          lte(applications.updatedAt, addDays(today(), -21)),
        ),
      ),
  ]);

  const byStage = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<
    Stage,
    number
  >;
  for (const row of stageCounts) byStage[row.stage] = row.total;

  const applied = everApplied[0]?.total ?? 0;
  const responded = everResponded[0]?.total ?? 0;

  return {
    active: STAGES.filter((stage) => stage !== "REJECTED").reduce(
      (sum, stage) => sum + byStage[stage],
      0,
    ),
    byStage,
    everApplied: applied,
    everResponded: responded,
    responseRate: applied === 0 ? null : responded / applied,
    staleCount: stale[0]?.total ?? 0,
  };
}

/** Next free slot at the bottom of a column. */
export async function nextPositionInStage(stage: Stage): Promise<number> {
  const db = await getDb();

  const [row] = await db
    .select({ max: sql<number | null>`max(${applications.position})` })
    .from(applications)
    .where(and(eq(applications.stage, stage), ne(applications.archived, true)))
    .limit(1);

  return (row?.max ?? 0) + 1000;
}
