import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Cpu,
  Gauge,
  Megaphone,
  Server,
  Users,
  Wifi,
} from "lucide-react";
import { SERVER } from "@/lib/noble-data";

async function fetchAnnouncement(): Promise<string> {
  const res = await fetch("/api/settings/announcement");
  const json = await res.json();
  return json.ok ? (json.announcement ?? "") : "";
}

export function ServerPanel() {
  const pct = Math.round((SERVER.playersOnline / SERVER.playersMax) * 100);
  const { data: announcement } = useQuery({
    queryKey: ["settings", "announcement"],
    queryFn: fetchAnnouncement,
    initialData: SERVER.announcement,
  });
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Server className="size-4 text-gold" />
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
            Server Panel
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-success">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          {SERVER.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/40 sm:grid-cols-3">
        <Stat
          icon={<Users className="size-3.5" />}
          label="Players Online"
          value={SERVER.playersOnline.toLocaleString()}
          accent
        />
        <Stat
          icon={<Wifi className="size-3.5" />}
          label="Ping"
          value={`${SERVER.ping} ms`}
        />
        <Stat
          icon={<Cpu className="size-3.5" />}
          label="TPS"
          value={SERVER.tps.toFixed(1)}
        />
        <Stat
          icon={<Gauge className="size-3.5" />}
          label="Version"
          value={SERVER.version}
          small
        />
        <Stat
          icon={<Activity className="size-3.5" />}
          label="Uptime"
          value={SERVER.uptime}
          small
        />
        <Stat
          icon={<Server className="size-3.5" />}
          label="Address"
          value={SERVER.ip}
          small
          tiny
        />
      </div>

      <div className="px-5 py-4">
        <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>Capacity</span>
          <span className="font-mono">
            {SERVER.playersOnline.toLocaleString()} /{" "}
            {SERVER.playersMax.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full rounded-full gold-surface transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-gold/20 bg-gold/6 p-4">
        <div className="mb-1.5 flex items-center gap-2 text-gold">
          <Megaphone className="size-3.5" />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em]">
            Latest Announcement
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">
          {announcement || "No announcements yet."}
        </p>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  small,
  tiny,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
  tiny?: boolean;
}) {
  return (
    <div className="min-w-0 bg-surface/60 px-5 py-3.5 transition-colors hover:bg-surface-raised/60">
      <div className="flex items-center gap-1.5 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        title={value}
        className={`mt-1 truncate font-display font-bold ${
          tiny ? "text-xs" : small ? "text-sm" : "text-xl"
        } ${accent ? "text-gold" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
