import { createFileRoute } from "@tanstack/react-router";
import { LeaderboardTable } from "@/components/noble/LeaderboardTable";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Noble PvP Tier List" },
      {
        name: "description",
        content: "Full Noble ranked leaderboard across Sword, Diamond Pot and UHC.",
      },
      { property: "og:title", content: "Rankings — Noble PvP Tier List" },
      {
        property: "og:description",
        content: "Every ranked Noble player, filterable by region, rank and gamemode.",
      },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Global <span className="gold-text">Rankings</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Season 7 ranked ladder — updated live after every match.
        </p>
      </header>
      <LeaderboardTable />
    </div>
  );
}
