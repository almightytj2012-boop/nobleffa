import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  Award,
  Clock,
  Crown,
  Flame,
  Skull,
  Swords,
  Target,
  Trophy,
  Users,
  FlaskConical,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ACHIEVEMENTS,
  GAMEMODES,
  bodyUrl,
  eloHistory,
  fetchPlayer,
  headUrl,
  kdr,
  matchHistory,
  rankFromElo,
} from "@/lib/noble-data";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { ClanTag, RankBadge, RegionBadge, SectionTitle } from "@/components/noble/Badges";

export const Route = createFileRoute("/player/$username")({
  loader: async ({ params }) => {
    const player = await fetchPlayer(params.username);
    if (!player) throw notFound();
    return { player };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Player not found — Noble" }, { name: "robots", content: "noindex" }],
      };
    }
    const { player } = loaderData;
    const title = `${player.username} — Noble Player Profile`;
    const description = `${player.username} is ${rankFromElo(player.elo)} with ${player.elo} Elo, ${player.kills} kills and a ${kdr(player).toFixed(2)} KDR on Noble.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { player: p } = Route.useLoaderData();
  const { players } = useLeaderboard();
  // NOTE: eloHistory/matchHistory are still simulated placeholders — there's
  // no match-history table being synced yet, only current totals.
  const history = eloHistory(p);
  const matches = matchHistory(p);
  const friends = players.filter((f) => f.id !== p.id).slice(0, 6);
  const modes = GAMEMODES.filter((g) => g.id !== "overall" && p.modes[g.id]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      {/* Header */}
      <section className="panel relative mb-5 overflow-hidden animate-fade-up">
        <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
          <img
            src={bodyUrl(p.username, 280)}
            alt={`${p.username} Minecraft skin`}
            className="pixelated h-44 w-auto self-center drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)] animate-float"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold tracking-tight">{p.username}</h1>
              <ClanTag tag={p.clan} />
              <RegionBadge region={p.region} />
              <RankBadge rank={rankFromElo(p.elo)} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Member since {p.joined} · Main: {GAMEMODES.find((g) => g.id === p.main)?.label} ·
              Season 7
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-7">
              <Stat icon={<Crown className="size-3.5" />} label="Current Elo" value={String(p.elo)} accent />
              <Stat icon={<Trophy className="size-3.5" />} label="Highest Elo" value={String(p.peakElo)} />
              <Stat icon={<Swords className="size-3.5" />} label="Kills" value={p.kills.toLocaleString()} />
              <Stat icon={<Skull className="size-3.5" />} label="Deaths" value={p.deaths.toLocaleString()} />
              <Stat icon={<Target className="size-3.5" />} label="KDR" value={kdr(p).toFixed(2)} />
              <Stat icon={<Flame className="size-3.5" />} label="Best Streak" value={`${p.killstreak}x`} />
              <Stat icon={<Clock className="size-3.5" />} label="Playtime" value={`${p.playtimeHours}h`} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          {/* Graph */}
          <section className="panel p-5">
            <SectionTitle
              title="Elo Progression"
              subtitle="Last 24 ranked sessions"
              icon={<Activity className="size-4" />}
            />
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="eloFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} domain={["dataMin - 60", "dataMax + 60"]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => `Session ${v}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} fill="url(#eloFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Match history */}
          <section className="panel overflow-hidden">
            <div className="border-b border-border/60 px-5 py-3.5">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
                Match History
              </h2>
            </div>
            <ul className="divide-y divide-border/40">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gold/5"
                >
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      m.win
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-danger/40 bg-danger/10 text-danger"
                    }`}
                  >
                    {m.win ? "Win" : "Loss"}
                  </span>
                  <span className="text-sm text-muted-foreground">{m.mode}</span>
                  <span className="text-sm">
                    vs <span className="font-medium">{m.opponent}</span>
                  </span>
                  <span className="ml-auto font-mono text-sm text-muted-foreground">{m.score}</span>
                  <span
                    className={`w-14 text-right font-mono text-sm font-semibold ${m.win ? "text-success" : "text-danger"}`}
                  >
                    {m.delta > 0 ? "+" : ""}
                    {m.delta}
                  </span>
                  <span className="hidden w-16 text-right text-xs text-muted-foreground sm:block">
                    {m.when}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Achievements */}
          <section className="panel p-5">
            <SectionTitle title="Achievements" icon={<Award className="size-4" />} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ACHIEVEMENTS.map((a, i) => {
                const Icon = [Trophy, Flame, FlaskConical, Apple, Users, Clock][i] ?? Trophy;
                return (
                  <div
                    key={a.name}
                    className="hover-lift flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3.5 hover:-translate-y-0.5 hover:border-gold/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/8 text-gold">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          <section className="panel p-5">
            <SectionTitle title="Rank History" subtitle="Per gamemode" icon={<Crown className="size-4" />} />
            <ul className="space-y-2.5">
              {modes.map((g) => {
                const elo = p.modes[g.id]!;
                return (
                  <li key={g.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-muted-foreground">{g.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full rounded-full gold-surface"
                        style={{ width: `${Math.min(100, (elo / 2700) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs text-gold">{elo}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel p-5">
            <SectionTitle
              title="Clan"
              subtitle={p.clan ? "Active member" : "No clan"}
              icon={<Users className="size-4" />}
            />
            {p.clan ? (
              <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-gold/6 p-4">
                <span className="font-display text-2xl font-bold gold-text">{p.clan}</span>
                <div className="text-xs text-muted-foreground">
                  Ranked clan · Season 7 contender
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This player is a free agent.</p>
            )}
          </section>

          <section className="panel p-5">
            <SectionTitle title="Friends" icon={<Users className="size-4" />} />
            <div className="grid grid-cols-3 gap-2.5">
              {friends.map((f) => (
                <Link
                  key={f.id}
                  to="/player/$username"
                  params={{ username: f.id }}
                  className="hover-lift group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface/60 p-2.5 hover:-translate-y-0.5 hover:border-gold/40"
                >
                  <img
                    src={headUrl(f.username, 48)}
                    alt={f.username}
                    className="pixelated size-8 rounded-md transition-transform group-hover:scale-110"
                  />
                  <span className="w-full truncate text-center text-[11px] text-muted-foreground group-hover:text-gold">
                    {f.username}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 transition-colors hover:border-gold/35">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 font-display text-lg font-bold ${accent ? "text-gold" : ""}`}>
        {value}
      </div>
    </div>
  );
}
