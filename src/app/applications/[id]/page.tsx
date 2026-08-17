import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteApplication, deleteNote, setArchived } from "@/app/actions";
import { ApplicationEditor } from "@/components/ApplicationEditor";
import { NoteComposer } from "@/components/NoteComposer";
import { StagePicker } from "@/components/StagePicker";
import { getApplication } from "@/db/queries";
import { describeAge, formatDate } from "@/lib/dates";
import { STAGE_META } from "@/lib/stages";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({
  params,
}: {
  // Next.js 15+ passes route params as a promise, so dynamic APIs can be
  // awaited before the component renders.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getApplication(id);

  if (!data) notFound();

  const { application, notes, history } = data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/" className="text-xs text-muted hover:underline">
          ← Back to board
        </Link>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {application.company}
            </h1>
            <p className="text-sm text-muted">
              {application.role}
              {application.location && ` · ${application.location}`}
            </p>
          </div>

          <dl className="flex gap-6 text-xs">
            <div>
              <dt className="text-muted">Applied</dt>
              <dd className="mt-0.5 font-medium">{formatDate(application.appliedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Last touched</dt>
              <dd className="mt-0.5 font-medium">{describeAge(application.updatedAt)}</dd>
            </div>
            {application.url && (
              <div>
                <dt className="text-muted">Posting</dt>
                <dd className="mt-0.5">
                  <a
                    href={application.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-accent hover:underline"
                  >
                    Open ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-4">
          <StagePicker id={application.id} current={application.stage} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ApplicationEditor application={application} />

        <div className="flex flex-col gap-5">
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">Notes</h2>
            <NoteComposer applicationId={application.id} />

            {notes.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                {notes.map((note) => (
                  <li key={note.id} className="group">
                    <div className="flex items-baseline gap-2">
                      <time className="text-[11px] text-muted">
                        {formatDate(note.createdAt)}
                      </time>
                      <form
                        action={deleteNote.bind(null, note.id, application.id)}
                        className="ml-auto opacity-0 transition group-hover:opacity-100"
                      >
                        <button
                          className="btn-quiet"
                          type="submit"
                          aria-label="Delete note"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold">Stage history</h2>
            {history.length === 0 ? (
              <p className="text-sm text-muted">Nothing recorded yet.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {history.map((event) => (
                  <li key={event.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`size-1.5 rounded-full ${STAGE_META[event.toStage].dot}`}
                      aria-hidden
                    />
                    <span>
                      {event.fromStage
                        ? `${STAGE_META[event.fromStage].label} → ${STAGE_META[event.toStage].label}`
                        : `Added as ${STAGE_META[event.toStage].label}`}
                    </span>
                    <time className="ml-auto text-[11px] text-muted">
                      {formatDate(event.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card border-rose-200 p-4 dark:border-rose-950">
            <h2 className="mb-1 text-sm font-semibold">Danger zone</h2>
            <p className="mb-3 text-xs text-muted">
              Archiving hides it from the board but keeps it in your stats.
              Deleting removes the application, its notes and its history.
            </p>
            <div className="flex gap-2">
              <form action={setArchived.bind(null, application.id, !application.archived)}>
                <button className="btn-ghost" type="submit">
                  {application.archived ? "Unarchive" : "Archive"}
                </button>
              </form>
              <form action={deleteApplication.bind(null, application.id)}>
                <button
                  className="btn border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  type="submit"
                  aria-label="Delete application"
                >
                  Delete
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
