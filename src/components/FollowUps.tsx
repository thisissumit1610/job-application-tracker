import Link from "next/link";

import { clearFollowUp, snoozeFollowUp } from "@/app/actions";
import type { BoardApplication } from "@/db/queries";
import { describeDue, dueStatus } from "@/lib/dates";
import { STAGE_META } from "@/lib/stages";

/**
 * A server component with no client JavaScript at all — the buttons are plain
 * forms pointed at server actions, so snoozing works even before hydration.
 */
export function FollowUps({ applications }: { applications: BoardApplication[] }) {
  if (applications.length === 0) return null;

  const overdue = applications.filter((a) => dueStatus(a.nextActionAt) === "overdue");

  return (
    <section className="card border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <header className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">Needs your attention</h2>
        <span className="text-xs text-muted">
          {applications.length} due{overdue.length > 0 && `, ${overdue.length} overdue`}
        </span>
      </header>

      <ul className="flex flex-col gap-2">
        {applications.map((application) => (
          <li
            key={application.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-surface px-3 py-2"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${STAGE_META[application.stage].dot}`}
              aria-hidden
            />
            <Link
              href={`/applications/${application.id}`}
              className="text-sm font-medium hover:underline"
            >
              {application.company}
            </Link>
            <span className="text-xs text-muted">{application.role}</span>

            <span
              className={`text-xs font-medium ${
                dueStatus(application.nextActionAt) === "overdue"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {describeDue(application.nextActionAt)}
            </span>

            {application.nextActionNote && (
              <span className="truncate text-xs text-muted">
                — {application.nextActionNote}
              </span>
            )}

            <div className="ml-auto flex items-center gap-1">
              <form action={snoozeFollowUp.bind(null, application.id, 3)}>
                <button className="btn-quiet" type="submit">
                  +3d
                </button>
              </form>
              <form action={snoozeFollowUp.bind(null, application.id, 7)}>
                <button className="btn-quiet" type="submit">
                  +1w
                </button>
              </form>
              <form action={clearFollowUp.bind(null, application.id)}>
                <button className="btn-quiet" type="submit">
                  Done
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
