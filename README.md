# Job Tracker

A Kanban board for job applications. Drag a company between stages, log what
happened in each round, and get told which follow-ups are overdue.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
Drizzle ORM and libSQL (SQLite). Everything runs locally — no accounts, no
external services, no API keys.

---

## Quick start

Requires **Node 20.9 or newer** (Next.js 16's floor). Check with `node -v`.

```bash
npm install
npm run db:seed    # optional: fills the board with 8 sample applications
npm run dev
```

Open http://localhost:3000.

There is no migration step to run first. The database file is created and
migrated automatically on the first query, so a fresh clone works immediately.

`npm install` needs no C++ compiler and no build step. The database driver
(`@libsql/client`) ships as prebuilt platform binaries, so nothing is compiled
from source on any OS.

One gotcha while developing: `npm run db:seed` and `npm run db:reset` replace
the database file. If the dev server is already running it keeps a handle on the
*old* file and every write then fails with `SQLITE_READONLY_DBMOVED`. Restart the
dev server after either command.

`npm audit` reports 4 moderate advisories, all from `esbuild` inside
`drizzle-kit`. That's a dev-only CLI and the advisory concerns esbuild's dev
server, which is never started here. Clearing it means downgrading
`drizzle-kit` to a much older major, so it's left as-is.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate SQL migrations after editing `src/db/schema.ts` |
| `npm run db:studio` | Drizzle Studio — a browser UI for the database |
| `npm run db:seed` | Wipe and reload sample data |
| `npm run db:reset` | Delete the database file entirely |

---

## What's in it

**Board** — six columns (Wishlist → Applied → OA/Test → Interview → Offer →
Rejected). Cards drag between columns and the move is saved immediately.

**Follow-ups** — each application can carry a next-action date. Anything due
today or overdue is pulled into a strip at the top of the board with one-click
*+3d* / *+1w* / *Done* buttons.

**Stats** — open applications, response rate, and a count of applications that
have sat in "Applied" for over three weeks without movement.

**Detail page** — full editing, a notes timeline, and the complete stage
history for that application.

---

## Project structure

```
src/
├── app/
│   ├── actions.ts              All server actions (every write goes through here)
│   ├── page.tsx                The board
│   ├── layout.tsx
│   ├── globals.css             Design tokens + shared utilities
│   └── applications/[id]/
│       └── page.tsx            Detail page
├── components/                 Board, cards, forms
├── db/
│   ├── schema.ts               Drizzle table definitions
│   ├── index.ts                Connection + auto-migration
│   ├── queries.ts              Every read
│   └── seed.ts                 Sample data
└── lib/
    ├── stages.ts               The stage pipeline and its display metadata
    ├── dates.ts                Date maths and hydration-safe formatting
    └── validation.ts           Zod schemas for form input
drizzle/                        Generated SQL migrations (commit these)
data/                           SQLite file — gitignored
```

Reads live in `src/db/queries.ts`, writes live in `src/app/actions.ts`. Keeping
that split makes it obvious which code paths can change data.

---

## How a few things work

Worth reading if you're using this to learn the stack rather than just to track
applications.

**Server actions instead of API routes.** There is no `app/api` directory. A
form points its `action` at an exported async function marked `"use server"`,
and Next.js handles the network round trip. Because that code never ships to
the browser, `src/app/actions.ts` can import the database directly at the top of
the file.

**Forms work without JavaScript.** The snooze buttons and the stage picker are
plain `<form>` elements wrapping a server action, rendered by server components.
They function before React hydrates. The drag-and-drop on the board is
pointer-only, which is why the detail page has a keyboard-accessible stage
picker as well.

**Optimistic drag-and-drop.** `Board.tsx` uses React 19's `useOptimistic` so a
dropped card lands in its new column instantly instead of snapping back while
the server action and route revalidation complete. Drag-and-drop itself is the
browser's native HTML5 API — no library.

**Stage history is stored, not derived.** Every move appends a row to
`stage_events`. That's what makes the response rate honest: an application
sitting in "Rejected" today may still have reached an interview, and only the
event log can tell you that.

**Dates are formatted by hand.** `lib/dates.ts` avoids
`toLocaleDateString()` because the server and the browser can produce different
strings for the same date, which surfaces as a React hydration mismatch. This is
one of the most common bugs in Next.js apps that render dates.

**One database connection, reused.** `getDb()` caches the connection *promise*
on `globalThis`. Next.js re-executes modules on every hot reload in development;
without the cache each file save would open another connection and re-run
migrations. Caching the promise rather than the resolved client also means
concurrent callers during startup await the same migration instead of racing
it.

**Tailwind v4 uses `@utility`, not `@layer components`.** Only real utilities
can be used with `@apply`, so shared classes like `.card` and `.btn-primary` are
registered with the `@utility` directive in `globals.css`. Stage colours are
written out as complete class strings in `lib/stages.ts` — Tailwind scans source
files for literal strings, so a dynamically built name like `` `bg-${c}-500` ``
produces an unstyled element.

---

## Deploying it

A `file:` database writes to the local filesystem, which is fine on your laptop,
a VPS, or anything with a persistent disk. It does **not** work on Vercel or
Netlify, where the filesystem is ephemeral and every request may hit a different
machine.

Because the driver is libSQL, moving to a hosted database is a config change
rather than a code change:

- **Turso** — create a database, then set `DATABASE_URL=libsql://…` and
  `DATABASE_AUTH_TOKEN=…`. No source file changes at all: same driver, same
  schema, same queries.
- **Postgres** (Neon, Supabase) — change `dialect` in `drizzle.config.ts` to
  `postgresql`, switch `sqliteTable` to `pgTable` in the schema, regenerate
  migrations, and use `drizzle-orm/postgres-js`. The queries themselves are
  unchanged.

Either way, add authentication before putting it on a public URL. Right now
anyone who reaches the deployment can read and edit everything.

---

## About keeping it in a private repo

The tracker holds recruiter names, email addresses and salary numbers, so a
private repo is the right call. Two things to keep in mind:

`data/` and `*.db` are gitignored, so the database never leaves your machine
even if the repo later goes public. The `drizzle/` folder **should** be
committed — those are schema migrations, not data.

Recruiters can't see private repos, and your contribution graph shows the
squares without the work. If this is meant to be a portfolio piece too, deploy
it somewhere public and link that, or make the repo public once you've reviewed
the commit history for anything you'd rather not share.

---

## Things deliberately left out

Reasonable next steps if you want to keep building:

- **Archived view.** Archiving works, but archived applications can only be
  reached by direct URL. A `/archive` route is a small, self-contained addition.
- **Reordering within a column.** The `position` column is a float specifically
  so a card can be dropped between two others by averaging its neighbours —
  the drop handler currently just appends to the end.
- **Search and filters.** Straightforward once there are more than ~30 rows.
- **Attachments.** Resume version and cover letter per application.
- **Reminders that leave the browser.** A cron job that emails you the
  follow-ups due today.
- **Tests.** There are none. `getStats` and the date helpers in `lib/dates.ts`
  are pure functions with real logic in them — the natural place to start with
  Vitest.
