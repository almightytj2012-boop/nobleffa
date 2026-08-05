import { MessageSquare, ShieldCheck, Users } from "lucide-react";
import { DISCORD } from "@/lib/noble-data";

export function DiscordPanel() {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="size-4 text-gold" />
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">Discord</h2>
        </div>
        <a
          href={DISCORD.invite}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg gold-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_22px_-6px_var(--gold)]"
        >
          Join
        </a>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border/40">
        <Mini label="Members" value={(DISCORD.members / 1000).toFixed(1) + "k"} icon={<Users className="size-3.5" />} />
        <Mini label="Online" value={DISCORD.online.toLocaleString()} icon={<span className="size-1.5 rounded-full bg-success" />} accent />
        <Mini label="Staff" value={String(DISCORD.staffOnline)} icon={<ShieldCheck className="size-3.5" />} />
      </div>

      <ul className="divide-y divide-border/50">
        {DISCORD.announcements.map((a) => (
          <li key={a.text} className="px-5 py-3.5 transition-colors hover:bg-surface-raised/50">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
              <span className="font-semibold text-gold">{a.author}</span>
              <span className="text-muted-foreground">{a.time}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">{a.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Mini({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface/60 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 font-display text-base font-bold ${accent ? "text-success" : ""}`}>
        {value}
      </div>
    </div>
  );
}
