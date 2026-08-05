import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Account — Noble" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isLoading } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.mc_username) setLinkedName(user.mc_username);
  }, [user?.mc_username]);

  // Poll every 3s while waiting on the player to run /noblelink in-game.
  useEffect(() => {
    if (!code || linkedName) return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/mc-link");
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      if (json.linked) {
        setLinkedName(json.mc_username);
        setCode(null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [code, linkedName]);

  async function requestCode() {
    setRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/mc-link", { method: "POST" });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Failed to generate a code.");
        return;
      }
      setCode(json.code);
      setPolling(true);
    } finally {
      setRequesting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-14 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="panel p-7 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl border border-danger/40 bg-danger/10 text-danger">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">
            Sign in required
          </h1>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl gold-surface px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 lg:px-8">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Your <span className="gold-text">Account</span>
        </h1>
        <p className="text-sm text-muted-foreground">{user.username} · {user.email}</p>
      </header>

      <section className="panel p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em]">
          Verification
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Verifying both proves the account is really yours — required before
          you can be granted admin access.
        </p>

        <div className="mt-4 flex items-center gap-2.5 text-sm">
          {user.email_verified ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <Circle className="size-4 text-muted-foreground" />
          )}
          Email {user.email_verified ? "verified" : "not verified — check your inbox for the link we sent when you signed up"}
        </div>

        <div className="mt-3 flex items-center gap-2.5 text-sm">
          {linkedName ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <Circle className="size-4 text-muted-foreground" />
          )}
          {linkedName ? (
            <span>Minecraft account linked: <strong>{linkedName}</strong></span>
          ) : (
            <span>Minecraft account not linked</span>
          )}
        </div>

        {!linkedName ? (
          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
            {code ? (
              <>
                <p className="text-sm">
                  In-game, run:{" "}
                  <code className="rounded bg-background px-2 py-0.5 font-mono text-gold">
                    /noblelink {code}
                  </code>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Waiting for it to be claimed… this code expires in 15 minutes.
                  {polling ? " Checking automatically." : null}
                </p>
              </>
            ) : (
              <button
                onClick={requestCode}
                disabled={requesting}
                className="inline-flex items-center justify-center rounded-xl gold-surface px-5 py-2 font-display text-sm font-bold uppercase tracking-widest disabled:opacity-60"
              >
                {requesting ? "Generating…" : "Link Minecraft account"}
              </button>
            )}
            {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
