import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, CreditCard, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { PAYMENT_METHODS, STORE_RANKS } from "@/lib/noble-data";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store — Noble Ranks & Perks" },
      {
        name: "description",
        content:
          "Buy VIP, MVP, MVP+ and Elite ranks for the Noble Minecraft PvP server. Instant LuckPerms sync, cosmetic discounts and exclusive arenas.",
      },
      { property: "og:title", content: "Store — Noble Ranks & Perks" },
      {
        property: "og:description",
        content:
          "VIP, MVP, MVP+ and Elite ranks with instant in-game delivery.",
      },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buying, setBuying] = useState<string | null>(null);

  async function buy(rankId: string, rankName: string) {
    if (!user) {
      toast.info("Sign in first", {
        description: "You need a Noble account to buy a rank.",
      });
      navigate({ to: "/login" });
      return;
    }
    setBuying(rankId);
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10_000);
      let res: Response;
      try {
        res = await fetch("/api/store/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rankId }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(t);
      }
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Checkout failed");
        return;
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      toast.success(`${rankName} order recorded`, {
        description: json.message,
      });
    } catch {
      toast.error("Couldn't reach the store right now");
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <header className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          <Sparkles className="size-3" /> Instant delivery
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight">
          Noble <span className="gold-text">Store</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Ranks sync automatically with LuckPerms the moment your payment clears
          — no commands, no waiting.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {STORE_RANKS.map((r, i) => (
          <article
            key={r.id}
            style={{ animationDelay: `${i * 70}ms` }}
            className={cn(
              "panel hover-lift group relative flex flex-col overflow-hidden p-5 animate-fade-up hover:-translate-y-1.5 hover:border-gold/45 hover:glow-ring",
              r.featured && "border-gold/45 glow-ring",
            )}
          >
            {r.featured ? (
              <span className="absolute right-4 top-4 rounded-full gold-surface px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                Popular
              </span>
            ) : null}
            <div className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-gold/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            <h2 className="font-display text-2xl font-bold uppercase tracking-wide gold-text">
              {r.name}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {r.tagline}
            </p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">
                ${r.price}
              </span>
              <span className="text-xs text-muted-foreground">one-time</span>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {r.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-foreground/85"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => buy(r.id, r.name)}
              disabled={buying === r.id}
              className="mt-6 w-full rounded-xl gold-surface px-4 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_28px_-6px_var(--gold)] active:scale-[0.98] disabled:opacity-60"
            >
              {buying === r.id ? "Processing…" : `Buy ${r.name}`}
            </button>
          </article>
        ))}
      </div>

      <section className="panel mt-5 grid gap-5 p-6 lg:grid-cols-3">
        <Info
          icon={<CreditCard className="size-4" />}
          title="Payment methods"
          body={PAYMENT_METHODS.join(" · ")}
        />
        <Info
          icon={<Zap className="size-4" />}
          title="LuckPerms sync"
          body="Purchases push straight to the permissions backend and apply in-game within seconds, across every Noble node."
        />
        <Info
          icon={<ShieldCheck className="size-4" />}
          title="Safe & reversible"
          body="Encrypted checkout, instant receipts, and 14-day support on any failed delivery."
        />
      </section>
    </div>
  );
}

function Info({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/8 text-gold">
        {icon}
      </span>
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
