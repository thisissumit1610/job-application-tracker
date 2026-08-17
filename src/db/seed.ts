/**
 * Fills the database with a realistic-looking pipeline so the board has
 * something to show on a fresh clone.
 *
 * Run with `npm run db:seed`. It clears the three tables first, so never point
 * it at a database you care about.
 */
import { getDb } from "./index";
import { applications, notes, stageEvents } from "./schema";
import type { Stage } from "../lib/stages";

function daysAgo(days: number): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function daysAhead(days: number): Date {
  return daysAgo(-days);
}

type SeedRow = {
  company: string;
  role: string;
  location: string;
  source: string;
  stage: Stage;
  priority: number;
  appliedDaysAgo: number | null;
  nextActionInDays: number | null;
  nextActionNote?: string;
  compensation?: string;
  contactName?: string;
  contactEmail?: string;
  /** Stages it passed through before landing on `stage`. */
  path: Stage[];
  notes: string[];
};

const ROWS: SeedRow[] = [
  {
    company: "Rippling Systems",
    role: "SDE Intern (Summer)",
    location: "Bengaluru",
    source: "Campus / placement cell",
    stage: "INTERVIEW",
    priority: 1,
    appliedDaysAgo: 24,
    nextActionInDays: 2,
    nextActionNote: "Round 3 — system design prep",
    compensation: "₹1.2L / month",
    contactName: "Priya Nair",
    contactEmail: "priya.nair@example.com",
    path: ["WISHLIST", "APPLIED", "OA", "INTERVIEW"],
    notes: [
      "OA was 2 DSA + 10 MCQ, 90 minutes. Graph question on shortest path with weights.",
      "Round 1 with a backend engineer: mostly about the distributed cache project on my resume. Went well.",
      "Round 2 was behavioural. They asked why systems over research — had a good answer ready.",
    ],
  },
  {
    company: "Helios Analytics",
    role: "Quantitative Analyst",
    location: "Mumbai",
    source: "Referral",
    stage: "OA",
    priority: 1,
    appliedDaysAgo: 9,
    nextActionInDays: -1,
    nextActionNote: "OA link expires in 48h — do it tonight",
    compensation: "Base + bonus, band not disclosed",
    contactName: "Arjun Mehta",
    path: ["WISHLIST", "APPLIED", "OA"],
    notes: [
      "Referred by Arjun (2023 batch). He said the test is heavy on probability and mental maths.",
    ],
  },
  {
    company: "Northwind Labs",
    role: "Research Engineer, Simulation",
    location: "Remote",
    source: "Cold email",
    stage: "APPLIED",
    priority: 2,
    appliedDaysAgo: 26,
    nextActionInDays: 0,
    nextActionNote: "Follow up — 3 weeks of silence",
    path: ["WISHLIST", "APPLIED"],
    notes: ["Emailed the hiring manager directly with the n-body simulation writeup."],
  },
  {
    company: "Cobalt Interactive",
    role: "Frontend Engineer",
    location: "Hyderabad",
    source: "LinkedIn",
    stage: "OFFER",
    priority: 1,
    appliedDaysAgo: 41,
    nextActionInDays: 4,
    nextActionNote: "Respond to offer by Friday",
    compensation: "₹18 LPA + ESOPs",
    contactName: "Devika Rao",
    contactEmail: "devika@example.com",
    path: ["WISHLIST", "APPLIED", "OA", "INTERVIEW", "OFFER"],
    notes: [
      "Take-home was a small React dashboard. Spent about six hours on it.",
      "Offer call went well. Asked for a week to decide — they agreed.",
    ],
  },
  {
    company: "Meridian Capital",
    role: "Technology Analyst",
    location: "Pune",
    source: "Campus / placement cell",
    stage: "REJECTED",
    priority: 3,
    appliedDaysAgo: 52,
    nextActionInDays: null,
    path: ["WISHLIST", "APPLIED", "OA", "REJECTED"],
    notes: ["Cleared the OA but did not get an interview call. No feedback given."],
  },
  {
    company: "Stratus Cloud",
    role: "Platform Engineer",
    location: "Bengaluru",
    source: "Company careers page",
    stage: "APPLIED",
    priority: 2,
    appliedDaysAgo: 6,
    nextActionInDays: 8,
    nextActionNote: "Check status if no reply",
    path: ["APPLIED"],
    notes: [],
  },
  {
    company: "Fermion Research",
    role: "Computational Physics Intern",
    location: "Remote",
    source: "Other",
    stage: "WISHLIST",
    priority: 2,
    appliedDaysAgo: null,
    nextActionInDays: 3,
    nextActionNote: "Applications open on the 20th",
    path: ["WISHLIST"],
    notes: ["Needs a 500-word statement of interest. Draft it over the weekend."],
  },
  {
    company: "Lattice Robotics",
    role: "Controls Software Intern",
    location: "Chennai",
    source: "Job board",
    stage: "WISHLIST",
    priority: 3,
    appliedDaysAgo: null,
    nextActionInDays: null,
    path: ["WISHLIST"],
    notes: [],
  },
];

async function seed() {
  const db = await getDb();

  await db.delete(stageEvents);
  await db.delete(notes);
  await db.delete(applications);

  for (const [index, row] of ROWS.entries()) {
    const [created] = await db
      .insert(applications)
      .values({
        company: row.company,
        role: row.role,
        location: row.location,
        source: row.source,
        stage: row.stage,
        priority: row.priority,
        position: (index + 1) * 1000,
        compensation: row.compensation ?? null,
        contactName: row.contactName ?? null,
        contactEmail: row.contactEmail ?? null,
        appliedAt: row.appliedDaysAgo === null ? null : daysAgo(row.appliedDaysAgo),
        nextActionAt:
          row.nextActionInDays === null ? null : daysAhead(row.nextActionInDays),
        nextActionNote: row.nextActionNote ?? null,
        createdAt: daysAgo(row.appliedDaysAgo ?? 3),
        updatedAt: daysAgo(Math.max(0, (row.appliedDaysAgo ?? 3) - row.path.length)),
      })
      .returning({ id: applications.id });

    // Spread the stage history backwards from the application date so the
    // timeline on the detail page reads sensibly.
    const span = row.appliedDaysAgo ?? 2;
    for (const [step, stage] of row.path.entries()) {
      await db.insert(stageEvents).values({
        applicationId: created.id,
        fromStage: step === 0 ? null : row.path[step - 1],
        toStage: stage,
        createdAt: daysAgo(Math.max(0, span - step * 5)),
      });
    }

    for (const [step, body] of row.notes.entries()) {
      await db.insert(notes).values({
        applicationId: created.id,
        body,
        createdAt: daysAgo(Math.max(0, span - step * 6)),
      });
    }
  }

  console.log(`Seeded ${ROWS.length} applications.`);
}

// Not top-level `await` — this file is loaded as CommonJS, where an async
// module body throws ERR_REQUIRE_ASYNC_MODULE.
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
