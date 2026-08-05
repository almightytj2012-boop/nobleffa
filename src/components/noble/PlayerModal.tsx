import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, ExternalLink, Skull, Swords, Target, X } from "lucide-react";
import {
  GAMEMODES,
  headUrl,
  kdr,
  modeRankLabel,
  rankFromElo,
  swordTierFromKills,
  type Player,
} from "@/lib/noble-data";
import { ClanTag, RankBadge, RegionBadge } from "./Badges";

/**
 * Quick-view popup opened by clicking a player row anywhere on the site.
 * Only shows stats we actually have live data for (kills/deaths/elo per
 * mode) — no simulated match history/graph here, that stays on the full
 * profile page where it's clearly a deeper (partly placeholder) view.
 */
export function PlayerModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const modes = GAMEMODES.filter((g) => g.id !== "overall");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="panel relative w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 flex size-8 items-center justify-center rounded-lg border border-border bg-surface/80 text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
        >
          <X className="size-4" />
        </button>

        <div className="relative overflow-hidden border-b border-border/60 p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <img
              src={headUrl(player.username, 96)}
              alt={player.username}
              className="pixelated size-16 rounded-xl border border-border"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-display text-xl font-bold">{player.username}</h2>
                <ClanTag tag={player.clan} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <RegionBadge region={player.region} />
                <RankBadge rank={rankFromElo(player.elo)} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 p-5">
          <Stat icon={<Crown className="size-3.5" />} label="Overall Elo" value={String(player.elo)} accent />
          <Stat icon={<Swords className="size-3.5" />} label="Kills" value={player.kills.toLocaleString()} />
          <Stat icon={<Skull className="size-3.5" />} label="Deaths" value={player.deaths.toLocaleString()} />
          <Stat icon={<Target className="size-3.5" />} label="KDR" value={kdr(player).toFixed(2)} />
          <Stat icon={<Crown className="size-3.5" />} label="Best Streak" value={`${player.killstreak}x`} />
          <Stat icon={<Crown className="size-3.5" />} label="Peak Elo" value={String(player.peakElo)} />
        </div>

        <div className="space-y-2 px-5 pb-5">
          {modes.map((g) => {
            const label = modeRankLabel(player, g.id);
            const raw = player.modes[g.id];
            if (raw === undefined || label === null) return null;
            return (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface/60 px-3.5 py-2"
              >
                <span className="text-sm text-muted-foreground">{g.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gold">
                    {g.id === "sword" ? `${raw} kills` : `${raw} elo`}
                  </span>
                  <span className="rounded-md border border-gold/30 bg-gold/8 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {g.id === "sword" ? swordTierFromKills(raw) : label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border/60 p-4">
          <Link
            to="/player/$username"
            params={{ username: player.id }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl gold-surface px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest"
          >
            Full profile
            <ExternalLink className="size-3.5" />
          </Link>
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
    <div className="rounded-xl border border-border bg-surface/60 px-3 py-2.5 transition-colors hover:border-gold/35">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 font-display text-base font-bold ${accent ? "text-gold" : ""}`}>
        {value}
      </div>
    </div>
  );
}
