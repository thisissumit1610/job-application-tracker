"use client";

import Link from "next/link";

import type { BoardApplication } from "@/db/queries";
import { describeDue, dueStatus } from "@/lib/dates";
import { priorityMeta } from "@/lib/stages";

const DUE_STYLES: Record<string, string> = {
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  today: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  soon: "bg-surface-muted text-muted",
  later: "bg-surface-muted text-muted",
};

type Props = {
  application: BoardApplication;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

export function ApplicationCard({
  application,
  isDragging,
  onDragStart,
  onDragEnd,
}: Props) {
  const due = dueStatus(application.nextActionAt);
  const priority = priorityMeta(application.priority);

  return (
    <article
      draggable
      onDragStart={(event) => {
        // Firefox will not start a drag unless some data is set.
        event.dataTransfer.setData("text/plain", application.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(application.id);
      }}
      onDragEnd={onDragEnd}
      className={`card group cursor-grab p-3 shadow-sm transition active:cursor-grabbing ${
        isDragging ? "opacity-40" : "hover:border-accent/50"
      }`}
    >
      {/* The link is not itself draggable, so the drag always starts on the
          wrapper and the browser never tries to drag the URL instead. */}
      <Link
        href={`/applications/${application.id}`}
        draggable={false}
        className="block"
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-1.5 size-1.5 shrink-0 rounded-full ${priority.dot}`}
            aria-label={`${priority.label} priority`}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {application.company}
            </p>
            <p className="truncate text-xs text-muted">{application.role}</p>
          </div>
        </div>
      </Link>

      {(application.location || due !== "none" || application.noteCount > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {application.location && (
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] text-muted">
              {application.location}
            </span>
          )}
          {application.nextActionAt && (
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${DUE_STYLES[due]}`}
              title={application.nextActionNote ?? undefined}
            >
              {describeDue(application.nextActionAt)}
            </span>
          )}
          {application.noteCount > 0 && (
            <span className="ml-auto text-[11px] tabular-nums text-muted">
              {application.noteCount} note{application.noteCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
