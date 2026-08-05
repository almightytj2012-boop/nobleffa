import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Apple,
  Crown,
  FlaskConical,
  Search,
  Swords,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GAMEMODES,
  REGIONS,
  eloRankLabel,
  eloRankColor,
  eloRankTiers,
  eloFor,
  headUrl,
  kdr,
  modeRankLabel,
  SWORD_TIERS,
  swordTierFromKills,
  type GamemodeId,
  type Player,
} from "@/lib/noble-data";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { ClanTag, RankBadge, RegionBadge } from "./Badges";
import { PlayerModal } from "./PlayerModal";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Swords,
  FlaskConical,
  Apple,
};

export function LeaderboardTable({ limit }: { limit?: number }) {
  const [mode, setMode] = useState<GamemodeId>("overall");
  const [region, setRegion] = useState<string>("all");
  const [rank, setRank] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Player | null>(null);
  const { players, isLoading, isError } = useLeaderboard();

  const isSword = mode === "sword";

  // Legend/Imperator are contested server-wide dpot LEADERBOARD POSITIONS
  // (see noble-data.ts), not an elo band, so they need each player's rank
  // among ALL dpot players — computed here from the unfiltered `players`
  // list so region/search/rank filters never distort who counts as #1-6.
  const dpotPositions = useMemo(() => {
    const map = new Map<string, number>();
    players
      .map((p) => ({ id: p.id, elo: eloFor(p, "dpot") }))
      .filter((r): r is { id: string; elo: number } => r.elo !== null)
      .sort((a, b) => b.elo - a.elo)
      .forEach((r, i) => map.set(r.id, i + 1));
    return map;
  }, [players]);

  // Rank-tier names differ between Sword (kill tiers) and Elo modes, so a
  // stale filter value from another mode would silently match nothing.
  useEffect(() => {
    setRank("all");
  }, [mode]);

  const rows = useMemo(() => {
    const list = players
      .map((p) => ({ p, elo: eloFor(p, mode) }))
      .filter((r): r is { p: Player; elo: number } => r.elo !== null)
      .filter((r) => (region === "all" ? true : r.p.region === region))
      .filter((r) =>
        rank === "all"
          ? true
          : (isSword
              ? swordTierFromKills(r.elo)
              : eloRankLabel(
                  mode,
                  r.elo,
                  mode === "dpot" ? dpotPositions.get(r.p.id) : undefined,
                )) === rank,
      )
      .filter((r) =>
        query.trim()
          ? r.p.username.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      )
      .sort((a, b) => b.elo - a.elo);
    return limit ? list.slice(0, limit) : list;
  }, [players, mode, region, rank, query, limit, isSword, dpotPositions]);

  return (
    <>
      {selected ? (
        <PlayerModal player={selected} onClose={() => setSelected(null)} />
      ) : null}
      <section className="panel overflow-hidden">
        {/* Gamemode tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-2.5 py-2">
          {GAMEMODES.map((g) => {
            const Icon = ICONS[g.icon]!;
            const active = mode === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setMode(g.id)}
                className={cn(
                  "group flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-transparent text-muted-foreground hover:bg-surface-raised hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player…"
              className="h-9 w-full rounded-lg border border-border bg-surface/70 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <Select
            value={region}
            onChange={setRegion}
            label="Region"
            options={["all", ...REGIONS]}
          />
          <Select
            value={rank}
            onChange={setRank}
            label="Rank"
            options={[
              "all",
              ...(isSword
                ? SWORD_TIERS.map((t) => t.name)
                : eloRankTiers(mode)),
            ]}
          />
          <Select
            value={mode}
            onChange={(v) => setMode(v as GamemodeId)}
            label="Gamemode"
            options={GAMEMODES.map((g) => g.id)}
            display={(v) => GAMEMODES.find((g) => g.id === v)?.label ?? v}
          />
          <span className="ml-auto hidden font-mono text-xs text-muted-foreground sm:block">
            {rows.length} players
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <Th className="w-14 pl-5">#</Th>
                <Th>Player</Th>
                <Th className="w-24">Region</Th>
                <Th className="w-36">Rank</Th>
                <Th className="w-24 text-right">{isSword ? "Kills" : "Elo"}</Th>
                <Th className="w-20 text-right">Kills</Th>
                <Th className="w-20 text-right">Deaths</Th>
                <Th className="w-28 pr-5 text-right">KDR</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, elo }, i) => {
                return (
                  <tr
                    key={p.id}
                    className="group border-b border-border/70 transition-colors last:border-0 hover:bg-surface-raised/70"
                  >
                    <td className="py-0 pl-5">
                      <RankNumber n={i + 1} />
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => setSelected(p)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <img
                          src={headUrl(p.username, 64)}
                          alt={`${p.username} head`}
                          loading="lazy"
                          className="pixelated size-8 rounded-md border border-border/70 transition-all duration-200 group-hover:scale-110 group-hover:border-gold/50 group-hover:shadow-[0_0_16px_-4px_var(--gold)]"
                        />
                        <span className="font-semibold transition-colors group-hover:text-gold">
                          {p.username}
                        </span>
                        <ClanTag tag={p.clan} />
                        {mode === "overall" ? (
                          <span className="hidden items-center gap-1 sm:flex">
                            <ModeTierBadge
                              label={modeRankLabel(p, "dpot")}
                              icon="D"
                            />
                            <ModeTierBadge
                              label={modeRankLabel(p, "uhc")}
                              icon="U"
                            />
                            <ModeTierBadge
                              label={modeRankLabel(p, "sword")}
                              icon="S"
                            />
                          </span>
                        ) : null}
                      </button>
                    </td>
                    <td>
                      <RegionBadge region={p.region} />
                    </td>
                    <td>
                      {isSword ? (
                        <span className="inline-flex items-center rounded-md border border-gold/40 bg-gold/10 px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold">
                          {swordTierFromKills(elo)}
                        </span>
                      ) : (
                        <RankBadge
                          rank={eloRankLabel(
                            mode,
                            elo,
                            mode === "dpot"
                              ? dpotPositions.get(p.id)
                              : undefined,
                          )}
                          {...(mode === "dpot"
                            ? {
                                color:
                                  eloRankColor(
                                    mode,
                                    elo,
                                    dpotPositions.get(p.id),
                                  ) ?? "#AAAAAA",
                              }
                            : {})}
                        />
                      )}
                    </td>
                    <td className="text-right font-display text-base font-bold text-gold">
                      {elo}
                    </td>
                    <td className="text-right font-mono text-success">
                      {p.kills}
                    </td>
                    <td className="text-right font-mono text-danger/80">
                      {p.deaths}
                    </td>
                    <td className="py-2.5 pr-5 text-right font-mono">
                      {kdr(p).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-muted-foreground"
                  >
                    {isLoading
                      ? "Loading live stats…"
                      : isError
                        ? "Couldn't load live stats right now — try again shortly."
                        : players.length === 0
                          ? "No live player data yet — waiting on the next server sync."
                          : "No players match these filters."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {limit ? (
          <div className="border-t border-border/60 p-3 text-center">
            <Link
              to="/rankings"
              className="inline-flex items-center gap-2 rounded-lg border border-gold/30 px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold/10"
            >
              <TrendingUp className="size-4" />
              View full rankings
            </Link>
          </div>
        ) : null}
      </section>
    </>
  );
}

/** Small "D · Hero" / "U · Silver" / "S · Nova II" chip shown next to a
 * player's name on the Overall board so you can see their rank in every
 * mode at a glance. Hidden if the player has no data for that mode. */
function ModeTierBadge({
  label,
  icon,
}: {
  label: string | null;
  icon: string;
}) {
  if (!label) return null;
  return (
    <span
      title={icon === "D" ? "Diamond Pot" : icon === "U" ? "UHC" : "Sword"}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground"
    >
      <span className="text-gold">{icon}</span>
      {label}
    </span>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-2 py-2.5 font-medium", className)}>{children}</th>
  );
}

function RankNumber({ n }: { n: number }) {
  const medal =
    n === 1
      ? "border-gold/50 text-gold-bright bg-gold/12"
      : n === 2
        ? "border-border text-foreground/80 bg-surface-raised"
        : n === 3
          ? "border-gold-deep/40 text-gold-deep bg-gold-deep/8"
          : "border-transparent text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg border font-display text-sm font-bold",
        medal,
      )}
    >
      {n}
    </span>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
  display,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: readonly string[];
  display?: (v: string) => string;
}) {
  return (
    <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface/70 px-3 text-xs text-muted-foreground transition-colors focus-within:border-gold/50">
      <span className="uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-foreground outline-none [&>option]:bg-background"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : (display?.(o) ?? o)}
          </option>
        ))}
      </select>
    </label>
  );
}
