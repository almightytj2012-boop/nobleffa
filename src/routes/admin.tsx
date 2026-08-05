import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Swords,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * fetch() has no timeout by default — if the server hangs on a slow DB
 * query, the request (and this whole panel) would previously just sit on
 * "Loading…" forever with no error. This aborts and throws after 10s so
 * the UI always ends up in a clear loading/error/data state.
 */
async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out — the server didn't respond in time.");
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Noble" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type AdminUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  email_verified: boolean;
  mc_username: string | null;
};

type AdminPlayer = {
  uuid: string;
  username: string;
  kills: number;
  deaths: number;
  hidden: 0 | 1;
  uhc_elo: number;
  sword_elo: number;
  dpot_elo: number;
};

type AdminOrder = {
  id: number;
  rank_id: string;
  rank_name: string;
  amount: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  created_at: string;
  username: string;
  email: string;
};

function AdminPage() {
  const { user, isLoading } = useAuth();
  const [tab, setTab] = useState<"users" | "players" | "orders" | "announcement" | "support">("orders");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-14 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <GatePanel
        icon={<ShieldAlert className="size-6" />}
        title="Sign in required"
        body="You need a Noble account to view this page."
        cta={{ to: "/login", label: "Go to login" }}
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <GatePanel
        icon={<ShieldAlert className="size-6" />}
        title="Admins only"
        body="Your account doesn't have admin access."
        cta={{ to: "/", label: "Back to dashboard" }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <header className="mb-6 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl border border-gold/25 bg-gold/8 text-gold">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Admin <span className="gold-text">Panel</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.username}
          </p>
        </div>
      </header>

      <div className="mb-5 inline-flex gap-1 rounded-xl border border-border bg-surface/60 p-1 text-sm font-semibold">
        <TabButton
          active={tab === "orders"}
          onClick={() => setTab("orders")}
          icon={<ShoppingCart className="size-3.5" />}
        >
          Orders
        </TabButton>
        <TabButton
          active={tab === "users"}
          onClick={() => setTab("users")}
          icon={<Users className="size-3.5" />}
        >
          Users
        </TabButton>
        <TabButton
          active={tab === "players"}
          onClick={() => setTab("players")}
          icon={<Swords className="size-3.5" />}
        >
          Players
        </TabButton>
        <TabButton
          active={tab === "announcement"}
          onClick={() => setTab("announcement")}
          icon={<Megaphone className="size-3.5" />}
        >
          Announcement
        </TabButton>
        <TabButton
          active={tab === "support"}
          onClick={() => setTab("support")}
          icon={<LifeBuoy className="size-3.5" />}
        >
          Support
        </TabButton>
      </div>

      {tab === "orders" ? <OrdersPanel /> : null}
      {tab === "users" ? <UsersPanel /> : null}
      {tab === "players" ? <PlayersPanel /> : null}
      {tab === "announcement" ? <AnnouncementPanel /> : null}
      {tab === "support" ? <SupportTicketsPanel /> : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 uppercase tracking-wider transition-colors",
        active ? "gold-surface" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function GatePanel({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="panel p-7 text-center animate-fade-up">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl border border-danger/40 bg-danger/10 text-danger">
          {icon}
        </span>
        <h1 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        <Link
          to={cta.to}
          className="mt-6 inline-flex items-center justify-center rounded-xl gold-surface px-5 py-2.5 font-display text-sm font-bold uppercase tracking-widest"
        >
          {cta.label}
        </Link>
      </div>
    </div>
  );
}

/* ---------- Orders ---------- */

const STATUS_STYLES: Record<AdminOrder["status"], string> = {
  pending: "border-gold/40 text-gold bg-gold/10",
  paid: "border-info/40 text-info bg-info/10",
  fulfilled: "border-success/40 text-success bg-success/10",
  cancelled: "border-danger/40 text-danger bg-danger/10",
};

function OrdersPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<AdminOrder[]> => {
      const res = await fetchJson("/api/admin/orders");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load orders");
      return json.orders;
    },
  });

  async function setStatus(orderId: number, status: AdminOrder["status"]) {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Failed to update order (${res.status})`);
        return;
      }
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (err) {
      // Network error, or the response wasn't JSON at all (e.g. a 500 HTML
      // error page) — this used to fail silently with no feedback at all.
      toast.error("Request failed — check your connection and try again.");
      console.error("setStatus failed:", err);
    }
  }

  const orders = query.data ?? [];

  return (
    <section className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Buyer</th>
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-5 py-2.5">
                  <div className="font-medium">{o.username}</div>
                  <div className="text-xs text-muted-foreground">{o.email}</div>
                </td>
                <td className="px-3 py-2.5">{o.rank_name}</td>
                <td className="px-3 py-2.5 font-mono">
                  ${Number(o.amount).toFixed(2)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                      STATUS_STYLES[o.status],
                    )}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      setStatus(o.id, e.target.value as AdminOrder["status"])
                    }
                    className="rounded-lg border border-border bg-surface/70 px-2 py-1 text-xs outline-none focus:border-gold/50"
                  >
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="fulfilled">fulfilled</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-muted-foreground"
                >
                  {query.isLoading
                    ? "Loading…"
                    : query.isError
                      ? `Couldn't load orders: ${(query.error as Error)?.message ?? "unknown error"}`
                      : "No orders yet"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Users ---------- */

function UsersPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const res = await fetchJson("/api/admin/users");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load users");
      return json.users;
    },
  });

  async function setRole(userId: number, role: AdminUser["role"]) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Failed to update user (${res.status})`);
        return;
      }
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      toast.error("Request failed — check your connection and try again.");
      console.error("setRole failed:", err);
    }
  }

  async function deleteUser(userId: number, username: string) {
    if (
      !window.confirm(
        `Permanently delete ${username}'s account? This removes their login, sessions, and order history. This can't be undone.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Failed to delete user (${res.status})`);
        return;
      }
      toast.success(`${username}'s account was deleted`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      toast.error("Request failed — check your connection and try again.");
      console.error("deleteUser failed:", err);
    }
  }

  const users = query.data ?? [];

  return (
    <section className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Username</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Verified</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {users.map((u) => {
              const canPromote = u.email_verified && !!u.mc_username;
              return (
              <tr key={u.id}>
                <td className="px-5 py-2.5 font-medium">{u.username}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className={u.email_verified ? "text-success" : "text-muted-foreground"}>
                      {u.email_verified ? "Email verified" : "Email not verified"}
                    </span>
                    <span className={u.mc_username ? "text-success" : "text-muted-foreground"}>
                      {u.mc_username ? `MC linked: ${u.mc_username}` : "MC not linked"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                      u.role === "admin"
                        ? "border-gold/40 text-gold bg-gold/10"
                        : "border-border text-muted-foreground bg-muted/60",
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        setRole(u.id, u.role === "admin" ? "user" : "admin")
                      }
                      disabled={u.role !== "admin" && !canPromote}
                      title={
                        u.role !== "admin" && !canPromote
                          ? "They need a verified email and a linked Minecraft account before they can be made admin."
                          : undefined
                      }
                      className="rounded-lg border border-border bg-surface/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
                    >
                      {u.role === "admin" ? "Revoke admin" : "Make admin"}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.username)}
                      className="rounded-lg border border-danger/30 bg-danger/5 px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:border-danger/60 hover:bg-danger/15"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-muted-foreground"
                >
                  {query.isLoading
                    ? "Loading…"
                    : query.isError
                      ? `Couldn't load users: ${(query.error as Error)?.message ?? "unknown error"}`
                      : "No users yet"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Players (Minecraft stats, separate from site accounts) ---------- */

function PlayersPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const listQuery = useQuery({
    queryKey: ["admin", "players"],
    queryFn: async (): Promise<AdminPlayer[]> => {
      const res = await fetchJson("/api/admin/players");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load players");
      return json.players;
    },
  });

  async function setHidden(uuid: string, username: string, hidden: boolean) {
    if (
      hidden &&
      !window.confirm(
        `Permanently hide ${username} from the public leaderboards (e.g. because it's a bot)? Unlike "Remove", this sticks even after the next sync — you can unhide them here any time.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetchJson("/api/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, hidden }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Failed to update player (${res.status})`);
        return;
      }
      toast.success(hidden ? `${username} hidden from leaderboards` : `${username} unhidden`);
      queryClient.invalidateQueries({ queryKey: ["admin", "players"] });
    } catch (err) {
      toast.error("Request failed — check your connection and try again.");
      console.error("setHidden failed:", err);
    }
  }

  async function removePlayer(uuid: string, username: string) {
    if (
      !window.confirm(
        `Remove ${username} from every leaderboard (Sword, UHC, Diamond Pot, Overall)? Their stats come back automatically next sync if they play again — for a permanent removal (e.g. a bot), use "Hide" instead.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetchJson("/api/admin/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Failed to remove player (${res.status})`);
        return;
      }
      toast.success(`${username} removed from the leaderboards`);
      queryClient.invalidateQueries({ queryKey: ["admin", "players"] });
    } catch (err) {
      toast.error("Request failed — check your connection and try again.");
      console.error("removePlayer failed:", err);
    }
  }

  const players = (listQuery.data ?? []).filter((p) =>
    query.trim() ? p.username.toLowerCase().includes(query.trim().toLowerCase()) : true,
  );


  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-border/60 p-3.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search player…"
          className="h-9 w-full max-w-xs rounded-lg border border-border bg-surface/70 px-3 text-sm outline-none focus:border-gold/50"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Player</th>
              <th className="px-3 py-3 text-right">Kills</th>
              <th className="px-3 py-3 text-right">Deaths</th>
              <th className="px-3 py-3 text-right">UHC Elo</th>
              <th className="px-3 py-3 text-right">Dia Pot Elo</th>
              <th className="px-3 py-3 text-right">Sword Kills</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {players.map((p) => (
              <tr key={p.uuid} className={p.hidden ? "opacity-50" : undefined}>
                <td className="px-5 py-2.5 font-medium">
                  {p.username}
                  {p.hidden ? (
                    <span className="ml-2 rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Hidden
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-right font-mono">{p.kills}</td>
                <td className="px-3 py-2.5 text-right font-mono">{p.deaths}</td>
                <td className="px-3 py-2.5 text-right font-mono">{p.uhc_elo}</td>
                <td className="px-3 py-2.5 text-right font-mono">{p.dpot_elo}</td>
                <td className="px-3 py-2.5 text-right font-mono">{p.sword_elo}</td>
                <td className="px-5 py-2.5 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setHidden(p.uuid, p.username, !p.hidden)}
                      title={
                        p.hidden
                          ? "Show this player on the public leaderboards again"
                          : "Permanently hide from public leaderboards (e.g. a bot) — survives the next sync"
                      }
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
                    >
                      {p.hidden ? "Unhide" : "Hide"}
                    </button>
                    <button
                      onClick={() => removePlayer(p.uuid, p.username)}
                      title="Wipes their stats now, but NobleSync recreates them next sync if they're still active"
                      className="rounded-lg border border-danger/30 bg-danger/5 px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:border-danger/60 hover:bg-danger/15"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {players.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-muted-foreground"
                >
                  {listQuery.isLoading
                    ? "Loading…"
                    : listQuery.isError
                      ? `Couldn't load players: ${(listQuery.error as Error)?.message ?? "unknown error"}`
                      : "No players found"}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Announcement ---------- */

type SupportTicket = {
  id: number;
  mc_username: string;
  kind: string;
  subject: string;
  message: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
};

function SupportTicketsPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "support"],
    queryFn: async (): Promise<SupportTicket[]> => {
      const res = await fetchJson("/api/admin/support");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load tickets");
      return json.tickets;
    },
  });

  async function setStatus(ticketId: number, status: SupportTicket["status"]) {
    try {
      const res = await fetchJson("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        toast.error(json?.error ?? `Failed to update ticket (${res.status})`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
    } catch (err) {
      toast.error("Request failed — check your connection and try again.");
      console.error("setStatus (support) failed:", err);
    }
  }

  const tickets = query.data ?? [];

  return (
    <section className="panel overflow-hidden">
      <div className="divide-y divide-border/40">
        {tickets.map((t) => (
          <div key={t.id} className="grid gap-2 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.kind}
              </span>
              <span className="font-display text-sm font-semibold">{t.subject}</span>
              <span className="text-xs text-muted-foreground">from {t.mc_username}</span>
              <select
                value={t.status}
                onChange={(e) => setStatus(t.id, e.target.value as SupportTicket["status"])}
                className="ml-auto rounded-lg border border-border bg-surface/70 px-2 py-1 text-xs outline-none focus:border-gold/50"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground">{t.message}</p>
          </div>
        ))}
        {tickets.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground">
            {query.isLoading
              ? "Loading…"
              : query.isError
                ? `Couldn't load tickets: ${(query.error as Error)?.message ?? "unknown error"}`
                : "No tickets yet"}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AnnouncementPanel() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["settings", "announcement"],
    queryFn: async (): Promise<string> => {
      const res = await fetchJson("/api/settings/announcement");
      const json = await res.json();
      if (!json.ok)
        throw new Error(json.error ?? "Failed to load announcement");
      return json.announcement ?? "";
    },
  });

  useEffect(() => {
    if (query.data !== undefined) setText(query.data);
  }, [query.data]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Failed to save");
        return;
      }
      toast.success("Announcement updated");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel p-5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">
        Homepage / server panel announcement
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={4}
        placeholder="Season 7 has started — climb the ladder for exclusive rewards."
        className="mt-2 w-full rounded-xl border border-border bg-surface/70 p-3.5 text-sm outline-none focus:border-gold/50 focus:ring-2 focus:ring-ring/40"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length}/500</span>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl gold-surface px-5 py-2 font-display text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </section>
  );
}
