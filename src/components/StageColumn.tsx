"use client";

import { useState } from "react";

import type { BoardApplication } from "@/db/queries";
import { STAGE_META, type Stage } from "@/lib/stages";

import { ApplicationCard } from "./ApplicationCard";

type Props = {
  stage: Stage;
  applications: BoardApplication[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: () => void;
};

export function StageColumn({
  stage,
  applications,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const meta = STAGE_META[stage];

  return (
    <section
      // `preventDefault` on dragOver is what marks an element as a valid drop
      // target. Without it the browser refuses the drop and nothing fires.
      onDragOver={(event) => {
        if (!draggingId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={(event) => {
        // Ignore events from children bubbling up as the pointer moves inside.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setIsOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        onDrop();
      }}
      className={`flex min-h-[220px] flex-col rounded-xl border transition ${
        isOver
          ? "border-accent bg-accent/5"
          : "border-line bg-surface-muted/60"
      }`}
      aria-label={`${meta.label} column`}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
        <h2 className="text-sm font-semibold">{meta.label}</h2>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted">
          {applications.length}
        </span>
      </header>

      <div className="thin-scroll flex max-h-[calc(100vh-320px)] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {applications.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted">{meta.blurb}</p>
        ) : (
          applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              isDragging={draggingId === application.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  );
}
