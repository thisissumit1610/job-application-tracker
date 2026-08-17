import { getBoardApplications, getFollowUps, getStats } from "@/db/queries";
import { Board } from "@/components/Board";
import { FollowUps } from "@/components/FollowUps";
import { QuickAddForm } from "@/components/QuickAddForm";
import { Stats } from "@/components/Stats";

/**
 * Reading straight from SQLite at render time, so this page must not be
 * prerendered at build time — otherwise `next build` would bake in whatever
 * rows existed on the build machine.
 */
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const [applications, followUps, stats] = await Promise.all([
    getBoardApplications(),
    getFollowUps(),
    getStats(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <Stats stats={stats} />
      <FollowUps applications={followUps} />
      <QuickAddForm />
      <Board applications={applications} />
    </div>
  );
}
