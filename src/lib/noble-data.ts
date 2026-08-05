export type Region = "NA" | "EU" | "AS" | "SA" | "OCE" | "AF";

export const REGIONS: Region[] = ["NA", "EU", "AS", "SA", "OCE", "AF"];

export const GAMEMODES = [
  { id: "overall", label: "Overall", icon: "Crown" },
  { id: "sword", label: "Sword", icon: "Swords" },
  { id: "dpot", label: "Diamond Pot", icon: "FlaskConical" },
  { id: "uhc", label: "UHC", icon: "Apple" },
] as const;

export type GamemodeId = (typeof GAMEMODES)[number]["id"];

/**
 * These are your ACTUAL UHCElo tiers, pulled straight from the "tiers:"
 * list in the UHCElo.jar you sent me (config.yml bundled in the jar) —
 * not a guess like the old placeholder ladder was. "UHC Champion" is a
 * capped top rank (max 10 players at once, granted/revoked via LuckPerms
 * by the plugin itself, not just crossing an elo line) — this shows it
 * as a simple elo-floor badge (2100+) for display purposes, which is a
 * reasonable approximation but can show slightly more "Champions" than
 * are actually holding the live in-game title if more than 10 players
 * are currently above that floor.
 */
export const UHC_TIERS: { name: string; floor: number }[] = [
  { name: "UHC Champion", floor: 2100 },
  { name: "UHC Master", floor: 1900 },
  { name: "Blood Champion", floor: 1700 },
  { name: "Elite Champion", floor: 1500 },
  { name: "Blood Knight", floor: 1300 },
  { name: "Netherite Elite", floor: 1100 },
  { name: "Netherite Warrior", floor: 900 },
  { name: "Diamond Fighter", floor: 700 },
  { name: "Diamond Initiate", floor: 550 },
  { name: "Steel Warrior", floor: 400 },
  { name: "Ironblood", floor: 250 },
  { name: "Stoneborn", floor: 0 },
];

export function uhcRankFromElo(elo: number): string {
  for (const t of UHC_TIERS) {
    if (elo >= t.floor) return t.name;
  }
  return UHC_TIERS[UHC_TIERS.length - 1]!.name;
}

/**
 * Your ACTUAL DiamondPotCore tiers, pulled from the real config.yml (the
 * "ranks:" list, lowest to highest, min-elo is inclusive) — not a guess.
 * Colors are the per-rank hex codes from that same config.
 *
 * Legend (#1 server-wide dpot elo) and Imperator (the next 5 below them)
 * are NOT in this list — config.yml is explicit that they're contested
 * LEADERBOARD POSITIONS, not a fixed elo band. You take someone's spot
 * the moment your elo passes theirs. See dpotRankLabel() below.
 */
export const DPOT_TIERS: { name: string; floor: number; color: string }[] = [
  { name: "Conquistador", floor: 1800, color: "#FF00AA" },
  { name: "Warlord", floor: 1500, color: "#FF0000" },
  { name: "Conqueror", floor: 1200, color: "#FF5555" },
  { name: "Champion", floor: 950, color: "#FFAA00" },
  { name: "Templar", floor: 700, color: "#AA00AA" },
  { name: "Knight", floor: 500, color: "#5555FF" },
  { name: "Squire", floor: 300, color: "#55FFFF" },
  { name: "Apprentice", floor: 100, color: "#55FF55" },
  { name: "Novice", floor: 0, color: "#AAAAAA" },
];

export const DPOT_LEGEND_SLOTS = 1;
export const DPOT_IMPERATOR_SLOTS = 5;
export const DPOT_LEGEND_COLOR = "#FF0000";
export const DPOT_IMPERATOR_COLOR = "#FF5555";

export function dpotRankFromElo(elo: number): string {
  for (const t of DPOT_TIERS) {
    if (elo >= t.floor) return t.name;
  }
  return DPOT_TIERS[DPOT_TIERS.length - 1]!.name;
}

/**
 * Legend/Imperator require knowing a player's server-wide dpot leaderboard
 * POSITION (1-based, among all dpot players sorted by elo), not just their
 * elo — pass it when you have it (LeaderboardTable does, since it already
 * has the full sorted list). Contexts with only a single player and no
 * reliable full-list position (player page, homepage widgets, PlayerModal)
 * omit `position` and fall back to the plain elo ladder, so the top band
 * just shows "Conquistador" there instead of guessing at Legend/Imperator.
 */
export function dpotRankLabel(elo: number, position?: number): string {
  if (position === 1) return "Legend";
  if (
    position !== undefined &&
    position <= DPOT_LEGEND_SLOTS + DPOT_IMPERATOR_SLOTS
  ) {
    return "Imperator";
  }
  return dpotRankFromElo(elo);
}

export function dpotTierColor(name: string): string {
  if (name === "Legend") return DPOT_LEGEND_COLOR;
  if (name === "Imperator") return DPOT_IMPERATOR_COLOR;
  return DPOT_TIERS.find((t) => t.name === name)?.color ?? "#AAAAAA";
}

/** Rank-tier names/labels for a given elo, using the right ladder for
 * whichever mode is currently selected. UHC and Diamond Pot both have
 * their own real tier names now, pulled from their actual configs. */
export function eloRankTiers(mode: GamemodeId): readonly string[] {
  if (mode === "uhc") return UHC_TIERS.map((t) => t.name);
  if (mode === "dpot")
    return ["Legend", "Imperator", ...DPOT_TIERS.map((t) => t.name)];
  return RANK_TIERS;
}

export function eloRankLabel(
  mode: GamemodeId,
  elo: number,
  position?: number,
): string {
  if (mode === "uhc") return uhcRankFromElo(elo);
  if (mode === "dpot") return dpotRankLabel(elo, position);
  return rankFromElo(elo);
}

/** Border/text color for a mode-specific rank badge (uhc/dpot only —
 * these use real per-rank colors from their configs). Returns undefined
 * for "overall"/sword, which keep their existing static Tailwind styles. */
export function eloRankColor(
  mode: GamemodeId,
  elo: number,
  position?: number,
): string | undefined {
  if (mode === "dpot") return dpotTierColor(dpotRankLabel(elo, position));
  return undefined;
}

/**
 * "Overall" is a site-only combined ranking (Diamond Pot + UHC elo summed),
 * with no in-game equivalent in any single plugin — this ladder was always
 * an invented site-wide scale, not a copy of any one plugin's config, so
 * it's intentionally left as-is now that dpot/uhc have their real ladders.
 */
export const RANK_TIERS = [
  "Noble",
  "Grandmaster",
  "Master",
  "Diamond",
  "Platinum",
  "Gold",
  "Silver",
  "Bronze",
] as const;
export type RankTier = (typeof RANK_TIERS)[number];

export function rankFromElo(elo: number): RankTier {
  if (elo >= 2400) return "Noble";
  if (elo >= 2150) return "Grandmaster";
  if (elo >= 1950) return "Master";
  if (elo >= 1750) return "Diamond";
  if (elo >= 1550) return "Platinum";
  if (elo >= 1350) return "Gold";
  if (elo >= 1150) return "Silver";
  return "Bronze";
}

/**
 * Sword has no Elo — SwordCore ranks players purely by lifetime kills on a
 * fixed 25-tier ladder (+ the "Star Eater" capstone). These thresholds are
 * the real defaults baked into SwordCore's TierRegistry, so this mirrors the
 * in-game ladder exactly unless the server owner overrides kill counts in
 * SwordCore's config.yml.
 */
export const SWORD_TIERS: { id: string; name: string; kills: number }[] = [
  { id: "WARNING_I", name: "Warning I", kills: 0 },
  { id: "WARNING_II", name: "Warning II", kills: 10 },
  { id: "WARNING_III", name: "Warning III", kills: 25 },
  { id: "WARNING_IV", name: "Warning IV", kills: 45 },
  { id: "CRESCENT_I", name: "Crescent I", kills: 70 },
  { id: "CRESCENT_II", name: "Crescent II", kills: 100 },
  { id: "CRESCENT_III", name: "Crescent III", kills: 135 },
  { id: "CRESCENT_IV", name: "Crescent IV", kills: 175 },
  { id: "HALO_I", name: "Halo I", kills: 220 },
  { id: "HALO_II", name: "Halo II", kills: 270 },
  { id: "HALO_III", name: "Halo III", kills: 325 },
  { id: "HALO_IV", name: "Halo IV", kills: 385 },
  { id: "STARLIT_I", name: "Starlit I", kills: 450 },
  { id: "STARLIT_II", name: "Starlit II", kills: 520 },
  { id: "STARLIT_III", name: "Starlit III", kills: 600 },
  { id: "STARLIT_IV", name: "Starlit IV", kills: 685 },
  { id: "NOVA_I", name: "Nova I", kills: 775 },
  { id: "NOVA_II", name: "Nova II", kills: 875 },
  { id: "NOVA_III", name: "Nova III", kills: 985 },
  { id: "NOVA_IV", name: "Nova IV", kills: 1100 },
  { id: "GALAXY_I", name: "Galaxy I", kills: 1225 },
  { id: "GALAXY_II", name: "Galaxy II", kills: 1360 },
  { id: "GALAXY_III", name: "Galaxy III", kills: 1500 },
  { id: "GALAXY_IV", name: "Galaxy IV", kills: 1650 },
  { id: "STAR_EATER", name: "Star Eater", kills: 1800 },
];

export function swordTierFromKills(kills: number): string {
  let current = SWORD_TIERS[0]!.name;
  for (const t of SWORD_TIERS) {
    if (kills < t.kills) break;
    current = t.name;
  }
  return current;
}

/** Given a Player, returns the display rank name for a specific gamemode:
 * Elo-tier name for uhc/dpot, kill-tier name for sword. Used to show a
 * player's rank in each mode next to their name on the Overall leaderboard. */
export function modeRankLabel(p: Player, mode: GamemodeId): string | null {
  if (mode === "overall") return null;
  if (mode === "sword") {
    if (p.modes.sword === undefined) return null;
    return swordTierFromKills(p.modes.sword);
  }
  const elo = p.modes[mode];
  if (elo === undefined) return null;
  if (mode === "uhc") return uhcRankFromElo(elo);
  if (mode === "dpot") return dpotRankFromElo(elo);
  return rankFromElo(elo);
}

export type Player = {
  id: string;
  username: string;
  clan: string | null;
  region: Region;
  elo: number;
  peakElo: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  killstreak: number;
  playtimeHours: number;
  main: GamemodeId;
  modes: Partial<Record<GamemodeId, number>>;
  joined: string;
};

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * LIVE DATA TODO:
 * This used to be filled with fake/example players. Until the site is wired up
 * to your server's stats plugin (via a small API that reads its database),
 * this stays empty and the UI shows an empty/placeholder state instead of
 * fake numbers.
 */
export const PLAYERS: Player[] = [];

export function getPlayer(id: string) {
  return PLAYERS.find((p) => p.id === id.toLowerCase());
}

/* ---------- Live data from /api routes (backed by MySQL sync) ---------- */

// Raw shape returned by /api/leaderboard and /api/player/:username
export type ApiPlayerRow = {
  uuid: string;
  username: string;
  kills: number;
  deaths: number;
  killstreak: number;
  maxkillstreak: number;
  uhc_elo: number;
  sword_elo: number;
  dpot_elo: number;
  peak_elo?: number;
};

// Fields the DB doesn't track yet — kept as explicit, honest placeholders
// rather than faking numbers. Update this once you add real tracking.
function apiRowToPlayer(row: ApiPlayerRow): Player {
  // NOTE: `sword_elo` is a legacy column name — Sword has no Elo system, so
  // NobleSync writes lifetime kill count into it instead. Use
  // swordTierFromKills() to turn it into a rank, not rankFromElo().
  // Every field is set unconditionally (not `if (row.x)`) so a player who
  // is genuinely at 0 in a mode still shows up on that mode's leaderboard
  // instead of silently disappearing.
  const modes: Partial<Record<GamemodeId, number>> = {
    sword: row.sword_elo ?? 0,
    dpot: row.dpot_elo ?? 0,
    uhc: row.uhc_elo ?? 0,
  };

  // Overall = Diamond Pot + UHC elo combined (summed, not averaged).
  // Sword has no elo system, so it's shown separately per-mode but excluded
  // from Overall.
  const combinedElo = (row.uhc_elo ?? 0) + (row.dpot_elo ?? 0);
  const peakElo = row.peak_elo ?? combinedElo;
  const main =
    (Object.entries(modes).sort(
      (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
    )[0]?.[0] as GamemodeId) ?? "overall";

  return {
    id: row.username.toLowerCase(),
    username: row.username,
    clan: null,
    region: "NA", // TODO: not tracked yet
    elo: combinedElo,
    peakElo,
    wins: 0, // TODO: not tracked yet
    losses: 0, // TODO: not tracked yet
    kills: row.kills,
    deaths: row.deaths,
    killstreak: row.killstreak,
    playtimeHours: 0, // TODO: not tracked yet
    main,
    modes,
    joined: "—", // TODO: not tracked yet
  };
}

export async function fetchLeaderboard(): Promise<Player[]> {
  const res = await fetch("/api/leaderboard");
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Failed to load leaderboard");
  return (json.players as ApiPlayerRow[]).map(apiRowToPlayer);
}

export async function fetchPlayer(username: string): Promise<Player | null> {
  const res = await fetch(`/api/player/${encodeURIComponent(username)}`);
  if (res.status === 404) return null;
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Failed to load player");
  return apiRowToPlayer(json.player as ApiPlayerRow);
}

export function winRate(p: Player) {
  return (p.wins / Math.max(1, p.wins + p.losses)) * 100;
}

export function kdr(p: Player) {
  return p.kills / Math.max(1, p.deaths);
}

export function eloFor(p: Player, mode: GamemodeId) {
  return mode === "overall" ? p.elo : (p.modes[mode] ?? null);
}

export function headUrl(username: string, size = 64) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`;
}

export function bodyUrl(username: string, size = 240) {
  return `https://mc-heads.net/body/${encodeURIComponent(username)}/${size}`;
}

/* ---------- Server panel ---------- */

// LIVE DATA TODO: wire this up to your PebbleHost server (via a small API
// that reads your stats plugin's database). Placeholder / zero state for now.
export const SERVER = {
  status: "Unknown" as const,
  ip: "noble.minecraft.how",
  playersOnline: 0,
  playersMax: 0,
  ping: 0,
  tps: 0,
  version: "—",
  uptime: "—",
  announcement: "",
  announcedAt: "",
};

// Fallback shown only until /api/discord (a real, live call to Discord's
// public invite API) resolves. See fetchDiscord() below and useDiscord().
export const DISCORD = {
  name: "Noble Network",
  members: 0,
  online: 0,
  staffOnline: 0,
  invite: "https://discord.gg/mMKQWsXcuZ",
  announcements: [] as { author: string; time: string; text: string }[],
};

export type DiscordInfo = {
  name: string;
  icon: string | null;
  members: number;
  online: number;
  invite: string;
};

export async function fetchDiscord(): Promise<DiscordInfo> {
  const res = await fetch("/api/discord");
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Failed to load Discord info");
  return {
    name: json.name,
    icon: json.icon,
    members: json.members,
    online: json.online,
    invite: json.invite,
  };
}

/* ---------- Store ---------- */

export type StoreRank = {
  id: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  featured?: boolean;
  /**
   * The numeric package ID for this rank in your Tebex webstore (Creator
   * dashboard → Store → Packages → click a package → the ID is in the URL
   * and in the package settings). Required for checkout to work — set the
   * real ID for each rank below.
   */
  tebexPackageId: number;
};

export const STORE_RANKS: StoreRank[] = [
  {
    id: "vip",
    name: "VIP",
    price: 5,
    tagline: "Step into the court",
    tebexPackageId: 0, // TODO: replace with your real Tebex package ID
    features: [
      "25% cosmetic discount",
      "Custom chat prefix",
      "Chat color selection",
      "VIP queue priority",
    ],
  },
  {
    id: "mvp",
    name: "MVP",
    price: 10,
    tagline: "Make your presence known",
    tebexPackageId: 0, // TODO: replace with your real Tebex package ID
    features: [
      "50% cosmetic discount",
      "Extra cosmetics unlocked",
      "Better chat features",
      "Everything in VIP",
    ],
  },
  {
    id: "mvpplus",
    name: "MVP+",
    price: 15,
    tagline: "The competitive edge",
    featured: true,
    tebexPackageId: 0, // TODO: replace with your real Tebex package ID
    features: [
      "100% cosmetic discount",
      "MVP+ private arena",
      "Animated nametag",
      "Exclusive cosmetics",
      "Everything in MVP",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 20,
    tagline: "Nobility, unrestricted",
    tebexPackageId: 0, // TODO: replace with your real Tebex package ID
    features: [
      "Everything in MVP+",
      "Elite private arena",
      "Premium particle effects",
      "All future perks included",
      "Direct staff support line",
    ],
  },
];

export const PAYMENT_METHODS = [
  "Tebex",
  "PayPal",
  "Credit Card",
  "Google Pay",
  "Apple Pay",
];

/* ---------- Cosmetics ---------- */

export type Cosmetic = {
  name: string;
  category: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Noble";
  price: number;
};

export const COSMETIC_CATEGORIES = [
  "Trails",
  "Tags",
  "Particles",
  "Kill Effects",
  "Victory Effects",
  "Emotes",
  "Titles",
];

const COSMETIC_NAMES: Record<string, string[]> = {
  Trails: [
    "Gilded Comet",
    "Ember Wake",
    "Frost Drift",
    "Void Ribbon",
    "Sunspire",
    "Ashen Path",
  ],
  Tags: [
    "[NOBLE]",
    "[MONARCH]",
    "[SOVEREIGN]",
    "[DUELIST]",
    "[REGENT]",
    "[VANGUARD]",
  ],
  Particles: [
    "Golden Halo",
    "Storm Aura",
    "Crimson Orbit",
    "Prism Dust",
    "Obsidian Cloud",
    "Starfall",
  ],
  "Kill Effects": [
    "Gold Shatter",
    "Lightning Strike",
    "Bloom Burst",
    "Soul Drain",
    "Meteor",
    "Ice Lock",
  ],
  "Victory Effects": [
    "Crown Descent",
    "Firework Cascade",
    "Throne Rise",
    "Aurora Wave",
    "Coin Rain",
    "Solar Flare",
  ],
  Emotes: ["Bow", "Taunt", "Crown Toss", "Salute", "Slow Clap", "Sit"],
  Titles: [
    "The Undefeated",
    "Kingslayer",
    "Pot God",
    "Crystal Lord",
    "Iron Will",
    "Season Champion",
  ],
};

const RARITIES: Cosmetic["rarity"][] = [
  "Common",
  "Rare",
  "Epic",
  "Legendary",
  "Noble",
];

export const COSMETICS: Cosmetic[] = COSMETIC_CATEGORIES.flatMap(
  (category, ci) =>
    (COSMETIC_NAMES[category] ?? []).map((name, i) => ({
      name,
      category,
      rarity: RARITIES[Math.floor(seeded(ci * 10 + i, 3) * RARITIES.length)]!,
      price: Math.round((150 + seeded(ci * 10 + i, 5) * 2400) / 25) * 25,
    })),
);

/* ---------- Clans ---------- */

// LIVE DATA TODO: replace with real clans from your server once you have a
// clan/faction plugin (or decide to skip clans altogether).
export const CLAN_BOARD: {
  tag: string;
  name: string;
  points: number;
  members: number;
  wins: number;
}[] = [];

/* ---------- Profile detail ---------- */

const OPPONENT_NAMES = [
  "Kingslayer",
  "Frostbyte",
  "Vex",
  "Nightshade",
  "Ryder",
  "Solstice",
  "Wraith",
  "Ember",
  "Talon",
  "Zephyr",
  "Ashen",
  "Rook",
];

export function matchHistory(p: Player) {
  return Array.from({ length: 8 }, (_, i) => {
    const win = seeded(p.username.length + i, 13) > 0.38;
    return {
      id: i,
      mode: GAMEMODES[1 + Math.floor(seeded(i, 14) * 8)]!.label,
      opponent:
        OPPONENT_NAMES[Math.floor(seeded(i, 15) * OPPONENT_NAMES.length)]!,
      win,
      delta: (win ? 1 : -1) * (9 + Math.round(seeded(i, 16) * 18)),
      score: win ? "3 – 1" : "1 – 3",
      when: `${i + 1}h ago`,
    };
  });
}

export function eloHistory(p: Player) {
  let v = p.elo - 260;
  return Array.from({ length: 24 }, (_, i) => {
    v += (seeded(p.username.length + i, 17) - 0.42) * 60;
    v = Math.max(900, v);
    return { i, value: Math.round(i === 23 ? p.elo : v) };
  });
}

export const ACHIEVEMENTS = [
  {
    name: "Season Champion",
    desc: "Finished #1 in a ranked season",
    icon: "Trophy",
  },
  { name: "Untouchable", desc: "50 kill streak without dying", icon: "Flame" },
  {
    name: "Pot God",
    desc: "Reached Grandmaster in Diamond Pot",
    icon: "FlaskConical",
  },
  { name: "UHC Champion", desc: "1000 UHC wins", icon: "Apple" },
  {
    name: "Clan Founder",
    desc: "Created a clan with 20+ members",
    icon: "Users",
  },
  { name: "Veteran", desc: "1000 hours of playtime", icon: "Clock" },
];
