import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Noble Account" },
      {
        name: "description",
        content:
          "Sign in to your Noble account to track ranked stats, purchases and cosmetics.",
      },
      { property: "og:title", content: "Login — Noble Account" },
      {
        property: "og:description",
        content:
          "Access your Noble ranked profile, store purchases and cosmetics.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pending = login.isPending || register.isPending;

  const verifyParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("verify")
      : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login.mutateAsync({ identifier, password });
        toast.success("Welcome back");
        navigate({ to: "/" });
      } else {
        await register.mutateAsync({ username, email, password });
        toast.success("Account created — check your email to verify it");
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="panel relative overflow-hidden p-7 animate-fade-up">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold/10 blur-3xl animate-glow-pulse" />
        <div className="relative">
          <span className="flex size-11 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 p-2">
            <img src="/brand/noble-logo.png" alt="" className="size-full object-contain" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight">
            {mode === "login" ? (
              <>
                Welcome <span className="gold-text">back</span>
              </>
            ) : (
              <>
                Join <span className="gold-text">Noble</span>
              </>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to sync your ranked profile, purchases and cosmetics."
              : "Create an account to track purchases and manage your profile."}
          </p>

          {verifyParam === "success" ? (
            <p className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
              Email verified — you can sign in now.
            </p>
          ) : verifyParam === "invalid" || verifyParam === "error" ? (
            <p className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              That verification link is invalid or expired. Sign in and request a new one from your account page.
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-2 rounded-xl border border-border bg-surface/60 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "rounded-lg py-1.5 uppercase tracking-wider transition-colors",
                mode === "login"
                  ? "gold-surface"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={cn(
                "rounded-lg py-1.5 uppercase tracking-wider transition-colors",
                mode === "register"
                  ? "gold-surface"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            {mode === "login" ? (
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email or username
                </label>
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 rounded-xl border border-border bg-surface/70 px-3.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
                />
              </div>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Username
                  </label>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="YourIGN"
                    className="h-10 rounded-xl border border-border bg-surface/70 px-3.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-10 rounded-xl border border-border bg-surface/70 px-3.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </>
            )}
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 rounded-xl border border-border bg-surface/70 px-3.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl gold-surface px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_28px_-6px_var(--gold)] active:scale-[0.98] disabled:opacity-60"
            >
              {mode === "login" ? (
                <LogIn className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {pending
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Link your Minecraft account from your{" "}
            <a href="/account" className="text-gold hover:underline">
              Account page
            </a>{" "}
            after signing in
          </p>
        </div>
      </div>
    </div>
  );
}
