import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, FlaskConical, Swords, Apple } from "lucide-react";
import { LeaderboardTable } from "@/components/noble/LeaderboardTable";
import { ServerPanel } from "@/components/noble/ServerPanel";
import { DiscordPanel } from "@/components/noble/DiscordPanel";
import { PlayerModal } from "@/components/noble/PlayerModal";
import { SERVER, headUrl, rankFromElo, type Player } from "@/lib/noble-data";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { RankBadge } from "@/components/noble/Badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noble — Minecraft PvP Rankings & Server Dashboard" },
      {
        name: "description",
        content:
          "Live Noble FFA dashboard: Overall, Sword, Diamond Pot and UHC rankings, server status and season stats.",
      },
      {
        property: "og:title",
        content: "Noble — Minecraft PvP Rankings Dashboard",
      },
      {
        property: "og:description",
        content:
          "Live tier rankings, leaderboards and server status for the Noble PvP network.",
      },
    ],
  }),
  component: Dashboard,
});

const TICKER_ITEMS = [
  "SEASON 7 — LIVE",
  `PLAY ON ${SERVER.ip}`,
  "SWORD · DIAMOND POT · UHC",
  "VERIFIED TIERS, NO STAT PADDING",
  "CLIMB THE LADDER",
];

function Dashboard() {
  const { players } = useLeaderboard();
  const [selected, setSelected] = useState<Player | null>(null);
  // Sort by peakElo — same ranking the leaderboard table uses — so the
  // podium's #1/#2/#3 always match who's actually on top of the board.
  const top = [...players].sort((a, b) => b.peakElo - a.peakElo).slice(0, 3);
  const peakElo = players.length
    ? Math.max(...players.map((p) => p.peakElo))
    : null;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-8">
      {selected ? (
        <PlayerModal player={selected} onClose={() => setSelected(null)} />
      ) : null}

      {/* ---------------------------------------------------------------
          Hero. The gold band is a real diagonal cut (clip-path), not a
          rounded blur-blob — it's the "slash" this whole site's combat
          identity is built around. Wordmark runs oversized and tight
          against the left edge instead of being centered in a card. */}
      <section className="relative mb-3 overflow-hidden rounded-2xl border border-border animate-fade-up">
        <div className="pointer-events-none absolute inset-0 bg-[oklch(0.145_0_0)]" />
        <div
          className="pointer-events-none absolute -right-[10%] -top-[40%] h-[220%] w-[46%] bg-gradient-to-b from-gold/25 via-gold-deep/10 to-transparent"
          style={{ clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)" }}
        />
        <div
          className="pointer-events-none absolute -right-[2%] -top-[40%] h-[220%] w-[6%] bg-gold/40 blur-[2px]"
          style={{ clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_320px_at_10%_-10%,oklch(0.75_0.093_85/12%),transparent_70%)]" />

        <div className="relative flex flex-col gap-8 px-5 pb-6 pt-7 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:pb-7 lg:pt-9">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/80">
              <span className="inline-block size-1.5 rounded-full bg-gold animate-glow-pulse" />
              Season 7 · Live
            </div>
            <h1 className="mt-2 font-display text-[13vw] font-bold uppercase leading-[0.85] tracking-tight sm:text-6xl lg:text-7xl">
              Noble<span className="text-gold">.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Verified tiers across Sword, Diamond Pot and UHC — no invented
              ladders, no guesswork. Play FFA on{" "}
              <span className="font-mono text-gold">{SERVER.ip}</span> and
              climb.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ModeChip icon={<Swords className="size-3.5" />} label="Sword" />
              <ModeChip
                icon={<FlaskConical className="size-3.5" />}
                label="Diamond Pot"
              />
              <ModeChip icon={<Apple className="size-3.5" />} label="UHC" />
            </div>
          </div>

          {/* Stat rail: one hero number (Peak Elo) up top with the rest
              as a quiet inline row underneath — not four cloned boxes. */}
          <div className="shrink-0 lg:text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Server peak elo
            </div>
            <div className="font-display text-5xl font-bold text-gold lg:text-6xl">
              {peakElo !== null ? peakElo.toLocaleString() : "—"}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground lg:justify-end">
              <span>
                <span className="text-foreground">{SERVER.playersOnline}</span>{" "}
                online
              </span>
              <span>
                <span className="text-foreground">{players.length}</span> ranked
              </span>
              <span>
                <span className="text-foreground">—</span> kills today
              </span>
            </div>
          </div>
        </div>

        {/* Ticker tape — thin, honest, on-brand: real season/server copy on
            a slow loop, not fabricated match data. */}
        <div className="relative overflow-hidden border-t border-border/70 bg-surface/80 py-2">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-mono text-[11px] tracking-wider text-muted-foreground">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-10">
                {item}
                <span className="text-gold/50">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Podium — real elevation (like an actual podium) instead of
          three identical cards: #1 is taller and centered, #2/#3 flank
          it lower down. */}
      {top.length === 0 ? (
        <section className="panel mb-5 p-6 text-center text-sm text-muted-foreground">
          No live player data yet — connect your server's stats to populate the
          leaderboard.
        </section>
      ) : (
        <section className="mb-5 grid grid-cols-3 items-end gap-3">
          {[top[1], top[0], top[2]].map((p, slotIndex) =>
            p ? (
              <PodiumSlot
                key={p.id}
                player={p}
                place={slotIndex === 1 ? 1 : slotIndex === 0 ? 2 : 3}
                onClick={() => setSelected(p)}
              />
            ) : (
              <div key={slotIndex} />
            ),
          )}
        </section>
      )}

      {/* Main dashboard grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <LeaderboardTable limit={15} />
        <div className="flex flex-col gap-5">
          <ServerPanel />
          <DiscordPanel />
        </div>
      </div>
    </div>
  );
}

function ModeChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function PodiumSlot({
  player,
  place,
  onClick,
}: {
  player: Player;
  place: 1 | 2 | 3;
  onClick: () => void;
}) {
  const isFirst = place === 1;
  return (
    <button
      onClick={onClick}
      className={
        "panel hover-lift group flex w-full flex-col items-center gap-2.5 text-center transition-colors hover:border-gold/40 " +
        (isFirst
          ? "glow-ring border-gold/30 px-4 pb-5 pt-7 -translate-y-3"
          : "px-3 pb-4 pt-5 text-muted-foreground/90")
      }
    >
      <span
        className={
          "font-display font-bold " +
          (isFirst
            ? "text-3xl text-gold"
            : "text-xl text-gold/40 group-hover:text-gold")
        }
      >
        #{place}
      </span>
      <img
        src={headUrl(player.username, isFirst ? 128 : 96)}
        alt={player.username}
        className={
          "pixelated rounded-lg border transition-transform duration-300 group-hover:scale-110 " +
          (isFirst ? "size-16 border-gold/40" : "size-11 border-border")
        }
      />
      <div className="min-w-0">
        <div
          className={
            "truncate font-display font-bold group-hover:text-gold " +
            (isFirst
              ? "text-base text-foreground"
              : "text-sm text-foreground/90")
          }
        >
          {player.username}
        </div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <RankBadge rank={rankFromElo(player.elo)} />
          <span className="font-mono text-xs text-muted-foreground">
            {player.peakElo} Elo
          </span>
        </div>
      </div>
      {isFirst ? <Crown className="size-5 shrink-0 text-gold" /> : null}
    </button>
  );
}
