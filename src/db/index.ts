import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import * as schema from "./schema";

/**
 * libSQL is SQLite with a client/server protocol bolted on. Pointed at a
 * `file:` URL it is an ordinary local SQLite database; pointed at a Turso URL
 * it is a hosted one. Nothing else in the app changes between the two, which
 * is what makes deploying this a config edit rather than a rewrite.
 *
 * It also installs as a plain prebuilt binary — no node-gyp, no C++ toolchain.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/tracker.db";

type Db = ReturnType<typeof drizzle<typeof schema>>;

async function createDb(): Promise<Db> {
  // A local file:// database needs its directory to exist first.
  if (DATABASE_URL.startsWith("file:")) {
    const filePath = DATABASE_URL.slice("file:".length);
    const absolute = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
  }

  const client = createClient({
    url: DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client, { schema });

  // Applying migrations on first connection means `npm run dev` works on a
  // fresh clone with no setup step. For a multi-instance production deploy you
  // would run migrations once from a deploy step instead.
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  return db;
}

/**
 * Next.js re-executes modules on every hot reload in development. Caching the
 * connection promise on `globalThis` means one client and one migration run per
 * process, instead of a new one on every file save.
 *
 * The promise itself is cached, not the resolved value — so concurrent callers
 * during startup all await the same migration rather than racing it.
 */
const globalForDb = globalThis as unknown as {
  __jobTrackerDb?: Promise<Db>;
};

export function getDb(): Promise<Db> {
  globalForDb.__jobTrackerDb ??= createDb();
  return globalForDb.__jobTrackerDb;
}

export { schema };
