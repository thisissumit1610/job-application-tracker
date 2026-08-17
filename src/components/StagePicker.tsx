import { moveApplication } from "@/app/actions";
import { STAGES, STAGE_META, type Stage } from "@/lib/stages";

/**
 * One tiny form per stage. Server actions submitted this way work without
 * client-side JavaScript, which also makes the whole control keyboard-native —
 * the drag-and-drop on the board is pointer-only, so this is the accessible
 * path for moving an application.
 */
export function StagePicker({ id, current }: { id: string; current: Stage }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Stage">
      {STAGES.map((stage) => {
        const meta = STAGE_META[stage];
        const isCurrent = stage === current;

        return (
          <form key={stage} action={moveApplication.bind(null, id, stage)}>
            <button
              type="submit"
              disabled={isCurrent}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                isCurrent
                  ? `border-transparent ${meta.chip} cursor-default`
                  : "border-line bg-surface text-muted hover:border-accent/50 hover:text-ink"
              }`}
            >
              <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden />
              {meta.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}
