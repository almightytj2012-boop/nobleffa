import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  Search,
  LogIn,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { headUrl } from "@/lib/noble-data";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAuth } from "@/hooks/use-auth";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/rankings", label: "Rankings" },
  { to: "/store", label: "Store" },
  { to: "/leaderboards", label: "Leaderboards" },
  { to: "/discord", label: "Discord" },
  { to: "/support", label: "Support" },
] as const;

export function Navbar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { players } = useLeaderboard();
  const { user, logout } = useAuth();

  const results = q.trim()
    ? players
        .filter((p) =>
          p.username.toLowerCase().includes(q.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="relative flex size-8 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 p-1.5 transition-colors group-hover:bg-gold/20">
            <img src="/brand/noble-logo.png" alt="" className="size-full object-contain" />
          </span>
          <span className="font-display text-lg font-bold uppercase tracking-[0.16em] gold-text">
            Noble
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => {
            const active =
              l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-gold"
                    : "text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground",
                )}
              >
                {l.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-[9px] h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                ) : null}
              </Link>
            );
          })}
          {user?.role === "admin" ? (
            <Link
              to="/admin"
              className={cn(
                "relative ml-1 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
                pathname.startsWith("/admin")
                  ? "border-gold/50 bg-gold/12 text-gold"
                  : "border-gold/25 bg-gold/6 text-gold/90 hover:border-gold/45 hover:bg-gold/10",
              )}
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search players…"
              className="h-9 w-44 rounded-lg border border-border bg-surface/70 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:w-60 focus:border-gold/50 focus:ring-2 focus:ring-ring/40 xl:w-56 xl:focus:w-72"
            />
            {results.length > 0 ? (
              <div className="panel absolute right-0 top-11 w-72 overflow-hidden p-1.5">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to="/player/$username"
                    params={{ username: p.id }}
                    onClick={() => setQ("")}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-gold/10"
                  >
                    <img
                      src={headUrl(p.username, 32)}
                      alt=""
                      className="pixelated size-6 rounded-[4px]"
                    />
                    <span className="font-medium">{p.username}</span>
                    <span className="ml-auto font-mono text-xs text-gold">
                      {p.elo}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/15"
              >
                <img
                  src={headUrl(user.username, 24)}
                  alt=""
                  className="pixelated size-5 rounded-[4px]"
                />
                {user.username}
              </Link>
              <button
                onClick={() =>
                  logout.mutate(undefined, {
                    onSuccess: () => toast.success("Signed out"),
                  })
                }
                aria-label="Sign out"
                className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-danger/40 hover:text-danger"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3.5 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_20px_-6px_var(--gold)] sm:inline-flex"
            >
              <LogIn className="size-4" />
              Login
            </Link>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="grid gap-1 border-t border-border/70 bg-background/95 px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" ? (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/25 bg-gold/6 px-3 py-2 text-sm font-semibold text-gold"
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          ) : null}
          {user ? (
            <button
              onClick={() => {
                setOpen(false);
                logout.mutate(undefined, {
                  onSuccess: () => toast.success("Signed out"),
                });
              }}
              className="rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground"
            >
              Sign out ({user.username})
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground"
            >
              Login
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
