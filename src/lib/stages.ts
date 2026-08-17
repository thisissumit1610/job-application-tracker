/**
 * The pipeline a job application moves through.
 *
 * Stage values are stored in the database as these exact strings, so treat them
 * as an append-only list: renaming one means writing a migration.
 */
export const STAGES = [
  "WISHLIST",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type Stage = (typeof STAGES)[number];

type StageMeta = {
  label: string;
  blurb: string;
  /** Tailwind classes are written out in full so the JIT compiler can see them.
   *  Building class names dynamically (`bg-${color}-500`) silently produces
   *  unstyled elements, because Tailwind only scans for complete strings. */
  dot: string;
  chip: string;
};

export const STAGE_META: Record<Stage, StageMeta> = {
  WISHLIST: {
    label: "Wishlist",
    blurb: "Found it, haven't applied",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  APPLIED: {
    label: "Applied",
    blurb: "Application submitted",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  OA: {
    label: "OA / Test",
    blurb: "Online assessment pending or done",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  INTERVIEW: {
    label: "Interview",
    blurb: "In the interview loop",
    dot: "bg-violet-500",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  OFFER: {
    label: "Offer",
    blurb: "Offer received",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    blurb: "Closed out",
    dot: "bg-rose-400",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
};

/** Stages that count as "still alive" for the stats bar. */
export const OPEN_STAGES: Stage[] = ["WISHLIST", "APPLIED", "OA", "INTERVIEW", "OFFER"];

/** Reaching any of these means somebody actually responded to you. */
export const RESPONDED_STAGES: Stage[] = ["OA", "INTERVIEW", "OFFER"];

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

export const PRIORITIES = [
  { value: 1, label: "High", dot: "bg-rose-500" },
  { value: 2, label: "Medium", dot: "bg-amber-400" },
  { value: 3, label: "Low", dot: "bg-slate-300 dark:bg-slate-600" },
] as const;

export function priorityMeta(value: number) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1];
}

export const SOURCES = [
  "Campus / placement cell",
  "Referral",
  "LinkedIn",
  "Company careers page",
  "Job board",
  "Cold email",
  "Other",
] as const;
