import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, ShieldCheck, Users } from "lucide-react";
import { DISCORD } from "@/lib/noble-data";
import { useDiscord } from "@/hooks/use-discord";

export const Route = createFileRoute("/discord")({
  head: () => ({
    meta: [
      { title: "Discord — Noble Community" },
      {
        name: "description",
        content:
          "Join the Noble Discord: 84k members, live staff support, tournament announcements and scrim finding.",
      },
      { property: "og:title", content: "Discord — Noble Community" },
      {
        property: "og:description",
        content: "Live members, staff on duty and the latest Noble announcements.",
      },
    ],
  }),
  component: DiscordPage,
});

function DiscordPage() {
  const { discord } = useDiscord();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <section className="panel relative mb-5 overflow-hidden p-6 animate-fade-up">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-gold/10 blur-3xl animate-glow-pulse" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
              Noble <span className="gold-text">Discord</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scrims, tournaments, staff support and season news — all in one server.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Chip icon={<Users className="size-3.5" />} label="Members" value={discord.members.toLocaleString()} />
            <Chip icon={<span className="size-1.5 rounded-full bg-success" />} label="Online" value={discord.online.toLocaleString()} />
            <a
              href={discord.invite}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl gold-surface px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_28px_-6px_var(--gold)]"
            >
              Join Server
            </a>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-3.5">
          <MessageSquare className="size-4 text-gold" />
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
            Announcements
          </h2>
        </div>
        <ul className="divide-y divide-border/40">
          {DISCORD.announcements.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              No announcements yet.
            </li>
          ) : (
            DISCORD.announcements.map((a, i) => (
              <li key={i} className="px-5 py-4 transition-colors hover:bg-gold/5">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
                  <span className="font-semibold text-gold">{a.author}</span>
                  <span className="text-muted-foreground">{a.time} ago</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/85">{a.text}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Member/staff counts are live from Discord. A per-member online list needs a Discord bot
        connected to the server — ask Claude to help set that up if you want it.
      </p>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-3.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-display text-base font-bold text-gold">{value}</div>
    </div>
  );
}
