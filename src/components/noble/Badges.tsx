import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { RankTier, Region } from "@/lib/noble-data";

const RANK_STYLES: Record<RankTier, string> = {
  Noble:
    "border-gold/60 text-gold-bright bg-gold/12 shadow-[0_0_18px_-4px_var(--gold)]",
  Grandmaster: "border-danger/50 text-danger bg-danger/10",
  Master: "border-chart-4/50 text-chart-4 bg-chart-4/10",
  Diamond: "border-info/50 text-info bg-info/10",
  Platinum: "border-success/45 text-success bg-success/10",
  Gold: "border-gold/45 text-gold bg-gold/10",
  Silver: "border-border text-muted-foreground bg-muted/60",
  Bronze: "border-gold-deep/40 text-gold-deep bg-gold-deep/10",
};

/**
 * `rank` is a plain string (not just RankTier) because uhc/dpot ranks come
 * from their own real config-driven ladders (Stoneborn, Novice, Legend,
 * etc.) — a completely different name set from the site's "Overall"
 * Bronze→Noble ladder that RANK_STYLES/RankTier still cover. Pass `color`
 * (a hex code) for those; badges for the Overall ladder omit it and keep
 * using the existing static Tailwind styles.
 */
export function RankBadge({
  rank,
  color,
  className,
}: {
  rank: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider",
        color
          ? undefined
          : (RANK_STYLES[rank as RankTier] ??
              "border-border text-muted-foreground bg-muted/60"),
        className,
      )}
      style={
        color
          ? { borderColor: `${color}80`, color, backgroundColor: `${color}1f` }
          : undefined
      }
    >
      {rank}
    </span>
  );
}

export function RegionBadge({
  region,
  className,
}: {
  region: Region;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-surface-raised/70 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-widest text-muted-foreground",
        className,
      )}
    >
      {region}
    </span>
  );
}

export function ClanTag({ tag }: { tag: string | null }) {
  if (!tag) return <span className="text-xs text-muted-foreground/50">—</span>;
  return (
    <span className="rounded-[5px] border border-gold/30 bg-gold/8 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-gold">
      {tag}
    </span>
  );
}

export function Rarity({ rarity }: { rarity: string }) {
  const map: Record<string, string> = {
    Common: "text-muted-foreground border-border",
    Rare: "text-info border-info/40",
    Epic: "text-chart-4 border-chart-4/40",
    Legendary: "text-gold border-gold/40",
    Noble: "text-gold-bright border-gold/70 shadow-[0_0_16px_-6px_var(--gold)]",
  };
  return (
    <span
      className={cn(
        "rounded-md border bg-background/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        map[rarity],
      )}
    >
      {rarity}
    </span>
  );
}

export function PlayerLink({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/player/$username"
      params={{ username: id }}
      className={className}
    >
      {children}
    </Link>
  );
}

export function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      {icon ? (
        <div className="flex size-9 items-center justify-center rounded-xl border border-gold/25 bg-gold/8 text-gold">
          {icon}
        </div>
      ) : null}
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-wide">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
