"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { nextPositionInStage } from "@/db/queries";
import { applications, notes, stageEvents } from "@/db/schema";
import { addDays, today } from "@/lib/dates";
import { isStage, type Stage } from "@/lib/stages";
import {
  applicationSchema,
  noteSchema,
  quickAddSchema,
  toFormErrors,
  type FormState,
} from "@/lib/validation";

/**
 * Every mutation lives here. Marking the file `"use server"` turns each export
 * into a server action: the client calls it like a function, Next.js turns that
 * into a POST, and nothing in this file ships to the browser — which is why the
 * database import is safe to have at the top.
 */

function refresh(id?: string) {
  revalidatePath("/");
  if (id) revalidatePath(`/applications/${id}`);
}

/** Reads a `<form>` into a plain object zod can parse. */
function formToObject(formData: FormData): Record<string, unknown> {
  const entries: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") entries[key] = value;
  }
  return entries;
}

export async function createApplication(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = quickAddSchema.safeParse(formToObject(formData));

  if (!parsed.success) {
    return { ok: false, errors: toFormErrors(parsed.error) };
  }

  const { company, role, stage, url, nextActionAt } = parsed.data;
  const db = await getDb();
  const now = new Date();

  const [created] = await db
    .insert(applications)
    .values({
      company,
      role,
      stage,
      url,
      nextActionAt,
      // Landing straight in a post-application stage implies you applied today.
      appliedAt: stage === "WISHLIST" ? null : now,
      position: await nextPositionInStage(stage),
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: applications.id });

  await db
    .insert(stageEvents)
    .values({ applicationId: created.id, fromStage: null, toStage: stage, createdAt: now });

  refresh();
  return { ok: true, message: `Added ${company}` };
}

export async function updateApplication(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = applicationSchema.safeParse(formToObject(formData));

  if (!parsed.success) {
    return { ok: false, errors: toFormErrors(parsed.error) };
  }

  const db = await getDb();
  await db
    .update(applications)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(applications.id, id));

  refresh(id);
  return { ok: true, message: "Saved" };
}

/**
 * Called by the board when a card is dropped into a different column, and by
 * the stage picker on the detail page.
 */
export async function moveApplication(id: string, stage: Stage): Promise<void> {
  if (!isStage(stage)) return;

  const db = await getDb();
  const [current] = await db
    .select({ stage: applications.stage, appliedAt: applications.appliedAt })
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  if (!current || current.stage === stage) return;

  const now = new Date();

  await db
    .update(applications)
    .set({
      stage,
      position: await nextPositionInStage(stage),
      // Backfill the applied date the first time it leaves the wishlist.
      appliedAt: current.appliedAt ?? (stage === "WISHLIST" ? null : now),
      updatedAt: now,
    })
    .where(eq(applications.id, id));

  await db.insert(stageEvents).values({
    applicationId: id,
    fromStage: current.stage,
    toStage: stage,
    createdAt: now,
  });

  refresh(id);
}

export async function addNote(
  applicationId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = noteSchema.safeParse(formToObject(formData));

  if (!parsed.success) {
    return { ok: false, errors: toFormErrors(parsed.error) };
  }

  const db = await getDb();
  await db
    .insert(notes)
    .values({ applicationId, body: parsed.data.body, createdAt: new Date() });

  refresh(applicationId);
  return { ok: true, message: "Note added" };
}

export async function deleteNote(id: string, applicationId: string): Promise<void> {
  const db = await getDb();
  await db.delete(notes).where(eq(notes.id, id));
  refresh(applicationId);
}

export async function snoozeFollowUp(id: string, days: number): Promise<void> {
  const db = await getDb();
  await db
    .update(applications)
    .set({ nextActionAt: addDays(today(), days), updatedAt: new Date() })
    .where(eq(applications.id, id));

  refresh(id);
}

export async function clearFollowUp(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(applications)
    .set({ nextActionAt: null, nextActionNote: null, updatedAt: new Date() })
    .where(eq(applications.id, id));

  refresh(id);
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const db = await getDb();
  await db
    .update(applications)
    .set({ archived, updatedAt: new Date() })
    .where(eq(applications.id, id));

  refresh(id);
}

export async function deleteApplication(id: string): Promise<void> {
  const db = await getDb();
  // Notes and stage events go with it, via `onDelete: "cascade"` in the schema.
  await db.delete(applications).where(eq(applications.id, id));

  revalidatePath("/");
  redirect("/");
}
