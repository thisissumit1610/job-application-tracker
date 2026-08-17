"use client";

import { useOptimistic, useState, useTransition } from "react";

import { moveApplication } from "@/app/actions";
import type { BoardApplication } from "@/db/queries";
import { STAGES, type Stage } from "@/lib/stages";

import { StageColumn } from "./StageColumn";

/**
 * The Kanban board.
 *
 * Drag and drop uses the browser's native HTML5 drag events rather than a
 * library — for column-to-column moves that is a handful of handlers, and it
 * keeps the bundle free of a drag-and-drop dependency.
 *
 * `useOptimistic` moves the card the instant you drop it. Without it the card
 * would visibly snap back and wait for the server action to finish and the
 * route to revalidate, which reads as lag even when it is only ~100ms.
 */
export function Board({ applications }: { applications: BoardApplication[] }) {
  const [optimisticApplications, applyMove] = useOptimistic(
    applications,
    (state: BoardApplication[], move: { id: string; stage: Stage }) =>
      state.map((application) =>
        application.id === move.id ? { ...application, stage: move.stage } : application,
      ),
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(stage: Stage) {
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;

    const current = optimisticApplications.find((application) => application.id === id);
    if (!current || current.stage === stage) return;

    // Optimistic updates must be dispatched inside a transition, so React knows
    // which async action they belong to and when to discard them.
    startTransition(async () => {
      applyMove({ id, stage });
      await moveApplication(id, stage);
    });
  }

  if (applications.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
        <p className="text-sm font-medium">No applications yet</p>
        <p className="max-w-sm text-sm text-muted">
          Add the first one above. Start with roles you have found but not applied
          to — the wishlist column is for exactly that.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {STAGES.map((stage) => (
        <StageColumn
          key={stage}
          stage={stage}
          applications={optimisticApplications.filter(
            (application) => application.stage === stage,
          )}
          draggingId={draggingId}
          onDragStart={setDraggingId}
          onDragEnd={() => setDraggingId(null)}
          onDrop={() => handleDrop(stage)}
        />
      ))}
    </div>
  );
}
