import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { COSMETICS, COSMETIC_CATEGORIES } from "@/lib/noble-data";
import { Rarity } from "@/components/noble/Badges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cosmetics")({
  head: () => ({
    meta: [
      { title: "Cosmetics — Noble Trails, Tags & Effects" },
      {
        name: "description",
        content:
          "Browse Noble cosmetics: trails, tags, particles, kill effects, victory effects, emotes and titles.",
      },
      { property: "og:title", content: "Cosmetics — Noble Trails, Tags & Effects" },
      {
        property: "og:description",
        content: "Unlock trails, particles, kill effects, emotes and titles on Noble.",
      },
    ],
  }),
  component: CosmeticsPage,
});

function CosmeticsPage() {
  const [cat, setCat] = useState("All");
  const cats = ["All", ...COSMETIC_CATEGORIES];
  const items = COSMETICS.filter((c) => cat === "All" || c.category === cat);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          <span className="gold-text">Cosmetics</span> Vault
        </h1>
        <p className="text-sm text-muted-foreground">
          Spend Noble Coins earned from ranked wins — or unlock everything with MVP+ and Elite.
        </p>
      </header>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
              cat === c
                ? "border-gold/50 bg-gold/12 text-gold shadow-[0_0_22px_-8px_var(--gold)]"
                : "border-border text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((c, i) => (
          <article
            key={c.category + c.name}
            style={{ animationDelay: `${(i % 12) * 45}ms` }}
            className="panel hover-lift group relative overflow-hidden p-4 animate-fade-up hover:-translate-y-1 hover:border-gold/40 hover:glow-ring"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gold/12 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/8 text-gold transition-transform duration-300 group-hover:scale-110">
                <Palette className="size-4" />
              </span>
              <Rarity rarity={c.rarity} />
            </div>
            <h2 className="mt-3 font-display text-base font-bold group-hover:text-gold">
              {c.name}
            </h2>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.category}</p>
            <button
              onClick={() => toast.success(`${c.name} equipped preview`, { description: c.category })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gold/30 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold/12"
            >
              <Sparkles className="size-3.5" />
              {c.price.toLocaleString()} coins
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
