import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bug, Gavel, HelpCircle, LifeBuoy, MessagesSquare, Ticket, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Noble Help Center" },
      {
        name: "description",
        content:
          "Noble support: FAQ, ban appeals, bug reports, player reports, contact staff and ticket tracking.",
      },
      { property: "og:title", content: "Support — Noble Help Center" },
      {
        property: "og:description",
        content: "Appeals, bug reports, player reports and live ticket tracking for Noble.",
      },
    ],
  }),
  component: SupportPage,
});

const TABS = [
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "appeals", label: "Appeals", icon: Gavel },
  { id: "bugs", label: "Bug Reports", icon: Bug },
  { id: "reports", label: "Player Reports", icon: UserX },
  { id: "contact", label: "Contact Staff", icon: MessagesSquare },
  { id: "tickets", label: "Tickets", icon: Ticket },
] as const;

const FAQ = [
  ["How is Elo calculated?", "Every ranked match adjusts Elo based on opponent rating and round score. Placement matches carry a 3x multiplier."],
  ["When does the season reset?", "Seasons run 90 days. Elo soft-resets toward 1500 and cosmetics carry over permanently."],
  ["Why hasn't my rank applied?", "Ranks sync through LuckPerms within 60 seconds. If it's still missing, open a ticket with your transaction ID."],
  ["Can I change my region?", "Region is set from your first 10 ranked matches and can be changed once per season by staff request."],
  ["Do I need a paid rank to compete?", "No. Ranked queues, tiers and leaderboards are fully free — store ranks are cosmetic and convenience only."],
];

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
};

type Ticket_ = {
  id: number;
  kind: string;
  subject: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
};

function SupportPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("faq");

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/8 text-gold">
          <LifeBuoy className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Noble <span className="gold-text">Support</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Average first response time: 47 minutes.
          </p>
        </div>
      </header>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                tab === t.id
                  ? "border-gold/50 bg-gold/12 text-gold shadow-[0_0_22px_-8px_var(--gold)]"
                  : "border-border text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "faq" ? (
        <section className="panel divide-y divide-border/40 overflow-hidden">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-display text-sm font-semibold transition-colors group-open:text-gold hover:text-gold">
                {q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </section>
      ) : null}

      {tab === "tickets" ? <TicketsList /> : null}

      {tab !== "faq" && tab !== "tickets" ? (
        <SupportForm kind={tab} label={TABS.find((t) => t.id === tab)!.label} />
      ) : null}
    </div>
  );
}

function TicketsList() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["support", "tickets"],
    queryFn: async (): Promise<Ticket_[]> => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch("/api/support/tickets", { signal: controller.signal });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Failed to load tickets");
        return json.tickets;
      } finally {
        clearTimeout(t);
      }
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <section className="panel px-5 py-8 text-center text-muted-foreground">
        Sign in to see your ticket history.
      </section>
    );
  }

  const tickets = query.data ?? [];

  return (
    <section className="panel overflow-hidden">
      <ul className="divide-y divide-border/40">
        {tickets.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gold/5"
          >
            <span className="font-mono text-sm text-gold">#{t.id}</span>
            <span className="text-sm">{t.subject}</span>
            <span
              className={cn(
                "ml-auto rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                t.status === "open"
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : t.status === "in_review"
                    ? "border-info/40 bg-info/10 text-info"
                    : "border-success/40 bg-success/10 text-success",
              )}
            >
              {TICKET_STATUS_LABEL[t.status]}
            </span>
          </li>
        ))}
        {tickets.length === 0 ? (
          <li className="px-5 py-8 text-center text-muted-foreground">
            {query.isLoading
              ? "Loading…"
              : query.isError
                ? `Couldn't load tickets: ${(query.error as Error)?.message ?? "unknown error"}`
                : "You haven't submitted any tickets yet."}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function SupportForm({ kind, label }: { kind: string; label: string }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10_000);
      let res: Response;
      try {
        res = await fetch("/api/support/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            kind,
            mcUsername: data.get("mcUsername"),
            subject: data.get("subject"),
            message: data.get("message"),
          }),
        });
      } finally {
        clearTimeout(t);
      }
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Couldn't submit that (${res.status})`);
        return;
      }
      toast.success(`${label} submitted`, {
        description: `Ticket #${json.ticketId} — staff will respond via your ticket history.`,
      });
      form.reset();
    } catch (err: any) {
      toast.error(
        err?.name === "AbortError"
          ? "Request timed out — try again."
          : "Couldn't reach the server — check your connection.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel grid max-w-3xl gap-4 p-6">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">{label}</h2>
      <Field name="mcUsername" label="Minecraft username" placeholder="e.g. Aurum" />
      <Field name="subject" label="Subject" placeholder="Short summary" />
      <div className="grid gap-1.5">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Details</label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Include dates, match IDs, and any evidence links."
          className="rounded-xl border border-border bg-surface/70 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="justify-self-start rounded-xl gold-surface px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_28px_-6px_var(--gold)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        name={name}
        required
        placeholder={placeholder}
        className="h-10 rounded-xl border border-border bg-surface/70 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}
