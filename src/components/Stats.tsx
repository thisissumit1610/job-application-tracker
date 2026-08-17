import type { Stats as StatsData } from "@/db/queries";
import { STAGES, STAGE_META } from "@/lib/stages";

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-none">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function Stats({ stats }: { stats: StatsData }) {
  const total = STAGES.reduce((sum, stage) => sum + stats.byStage[stage], 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label="Open applications"
        value={String(stats.active)}
        hint="Everything not rejected"
      />
      <Tile
        label="Response rate"
        value={
          stats.responseRate === null
            ? "—"
            : `${Math.round(stats.responseRate * 100)}%`
        }
        hint={`${stats.everResponded} of ${stats.everApplied} applications advanced`}
      />
      <Tile
        label="Going stale"
        value={String(stats.staleCount)}
        hint="Applied 3+ weeks ago, no movement"
      />

      <div className="card px-4 py-3">
        <p className="mb-2 text-xs text-muted">Pipeline</p>
        {total === 0 ? (
          <p className="text-sm text-muted">No data yet</p>
        ) : (
          <>
            <div className="flex h-2 overflow-hidden rounded-full bg-surface-muted">
              {STAGES.map((stage) =>
                stats.byStage[stage] === 0 ? null : (
                  <div
                    key={stage}
                    className={STAGE_META[stage].dot}
                    style={{ width: `${(stats.byStage[stage] / total) * 100}%` }}
                    title={`${STAGE_META[stage].label}: ${stats.byStage[stage]}`}
                  />
                ),
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {STAGES.filter((stage) => stats.byStage[stage] > 0).map((stage) => (
                <span key={stage} className="flex items-center gap-1 text-[11px] text-muted">
                  <span className={`size-1.5 rounded-full ${STAGE_META[stage].dot}`} />
                  {STAGE_META[stage].label} {stats.byStage[stage]}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
