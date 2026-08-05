import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Crown, Flame, Skull, Target, Users } from "lucide-react";
import {
  CLAN_BOARD,
  headUrl,
  kdr,
  rankFromElo,
  type Player,
} from "@/lib/noble-data";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { RankBadge, RegionBadge } from "@/components/noble/Badges";

export const Route = createFileRoute("/leaderboards")({
  head: () => ({
    meta: [
      { title: "Leaderboards — Noble Top Elo, Kills & Clans" },
      {
        name: "description",
        content:
          "Noble leaderboards for top Elo, most kills, highest killstreak, best KDR, most playtime and top clans.",
      },
      {
        property: "og:title",
        content: "Leaderboards — Noble Top Elo, Kills & Clans",
      },
      {
        property: "og:description",
        content:
          "See who leads Noble in Elo, kills, killstreaks, KDR, playtime and clan points.",
      },
    ],
  }),
  component: LeaderboardsPage,
});

type Board = {
  title: string;
  icon: React.ReactNode;
  key: (p: Player) => number;
  format: (n: number) => string;
};

// Elo is the flagship metric — everything else on this page is downstream
// of it — so it gets a featured board instead of sitting in the grid as
// just one more identical tile.
const FEATURED_BOARD: Board = {
  title: "Top Elo",
  icon: <Crown className="size-4" />,
  key: (p) => p.elo,
  format: (n) => `${n}`,
};

const BOARDS: Board[] = [
  {
    title: "Most Kills",
    icon: <Skull className="size-4" />,
    key: (p) => p.kills,
    format: (n) => n.toLocaleString(),
  },
  {
    title: "Highest Killstreak",
    icon: <Flame className="size-4" />,
    key: (p) => p.killstreak,
    format: (n) => `${n}x`,
  },
  {
    title: "Best KDR",
    icon: <Target className="size-4" />,
    key: (p) => kdr(p),
    format: (n) => n.toFixed(2),
  },
  {
    title: "Most Playtime",
    icon: <Clock className="size-4" />,
    key: (p) => p.playtimeHours,
    format: (n) => `${n}h`,
  },
];

function LeaderboardsPage() {
  const { players, isLoading } = useLeaderboard();
  const featuredRows = [...players]
    .sort((x, y) => FEATURED_BOARD.key(y) - FEATURED_BOARD.key(x))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      {/* Header echoes the home hero's diagonal slash at a smaller scale,
          instead of a plain centered title — keeps the two pages feeling
          like the same site, not different templates. */}
      <header className="relative mb-5 overflow-hidden rounded-2xl border border-border">
        <div
          className="pointer-events-none absolute -right-[6%] -top-[60%] h-[320%] w-[26%] bg-gradient-to-b from-gold/20 via-gold-deep/8 to-transparent"
          style={{ clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)" }}
        />
        <div className="relative px-5 py-6 lg:px-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/80">
            Season 7
          </div>
          <h1 className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-tight lg:text-5xl">
            Leaderboards
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The best of Season 7 across every tracked metric.
          </p>
        </div>
      </header>

      {/* Featured Elo board — spans wide, larger rows, gold-tinted, so it
          reads as the primary board and everything below reads as
          secondary metrics, instead of six equal-weight tiles. */}
      <section className="panel mb-4 overflow-hidden border-gold/25 animate-fade-up">
        <div className="flex items-center gap-2.5 border-b border-gold/20 bg-gold/5 px-5 py-3.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/12 text-gold">
            {FEATURED_BOARD.icon}
          </span>
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-gold">
            {FEATURED_BOARD.title} — Season 7
          </h2>
        </div>
        <ul className="grid divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0">
          {featuredRows.map((p, i) => (
            <li
              key={p.id}
              className="sm:border-b sm:border-border/40 sm:odd:border-r"
            >
              <Link
                to="/player/$username"
                params={{ username: p.id }}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gold/6"
              >
                <span
                  className={`w-6 font-display text-base font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}
                >
                  {i + 1}
                </span>
                <img
                  src={headUrl(p.username, 64)}
                  alt=""
                  loading="lazy"
                  className="pixelated size-9 rounded-md border border-border/70 transition-transform group-hover:scale-110"
                />
                <span className="truncate text-sm font-semibold group-hover:text-gold">
                  {p.username}
                </span>
                <RegionBadge
                  region={p.region}
                  className="hidden sm:inline-flex"
                />
                <span className="ml-auto font-mono text-base font-bold text-gold">
                  {FEATURED_BOARD.format(FEATURED_BOARD.key(p))}
                </span>
              </Link>
            </li>
          ))}
          {featuredRows.length === 0 ? (
            <li className="col-span-2 px-5 py-6 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "No data yet"}
            </li>
          ) : null}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {BOARDS.map((b) => {
          const rows = [...players]
            .sort((x, y) => b.key(y) - b.key(x))
            .slice(0, 8);
          return (
            <section
              key={b.title}
              className="panel overflow-hidden animate-fade-up"
            >
              <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3.5">
                <span className="flex size-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/8 text-gold">
                  {b.icon}
                </span>
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
                  {b.title}
                </h2>
              </div>
              <ul className="divide-y divide-border/40">
                {rows.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      to="/player/$username"
                      params={{ username: p.id }}
                      className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-gold/6"
                    >
                      <span
                        className={`w-5 font-display text-sm font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}
                      >
                        {i + 1}
                      </span>
                      <img
                        src={headUrl(p.username, 48)}
                        alt=""
                        loading="lazy"
                        className="pixelated size-7 rounded-md border border-border/70 transition-transform group-hover:scale-110"
                      />
                      <span className="truncate text-sm font-medium group-hover:text-gold">
                        {p.username}
                      </span>
                      <RegionBadge
                        region={p.region}
                        className="hidden sm:inline-flex"
                      />
                      <span className="ml-auto font-mono text-sm font-semibold text-gold">
                        {b.format(b.key(p))}
                      </span>
                    </Link>
                  </li>
                ))}
                {rows.length === 0 ? (
                  <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                    {isLoading ? "Loading…" : "No data yet"}
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}

        <section className="panel overflow-hidden animate-fade-up">
          <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/8 text-gold">
              <Users className="size-4" />
            </span>
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
              Top Clans
            </h2>
          </div>
          <ul className="divide-y divide-border/40">
            {CLAN_BOARD.map((c, i) => (
              <li
                key={c.tag}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-gold/6"
              >
                <span
                  className={`w-5 font-display text-sm font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}
                >
                  {i + 1}
                </span>
                <span className="rounded-[5px] border border-gold/30 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gold">
                  {c.tag}
                </span>
                <span className="truncate text-sm font-medium">{c.name}</span>
                <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
                  {c.members} members
                </span>
                <span className="w-16 text-right font-mono text-sm font-semibold text-gold">
                  {c.points.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Hall of Nobles — a scrolling strip instead of a grid of identical
          rounded cards, so it doesn't repeat the same shape as everything
          above it on the page. */}
      <section className="panel mt-5 overflow-hidden">
        <div className="border-b border-border/60 px-5 py-3.5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
            Hall of Nobles — Season 7 Elite
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto p-4">
          {players.slice(0, 8).map((p) => (
            <Link
              key={p.id}
              to="/player/$username"
              params={{ username: p.id }}
              className="hover-lift group flex shrink-0 items-center gap-3 rounded-xl border border-border bg-surface/60 p-3 hover:-translate-y-1 hover:border-gold/40"
            >
              <img
                src={headUrl(p.username, 64)}
                alt=""
                className="pixelated size-10 rounded-lg transition-transform group-hover:scale-110"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold group-hover:text-gold">
                  {p.username}
                </div>
                <RankBadge rank={rankFromElo(p.elo)} className="mt-1" />
              </div>
            </Link>
          ))}
          {players.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "No data yet"}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
