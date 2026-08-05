import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// Manages rows in `noble_players` (synced from the server's stats plugins),
// which is a different table from `noble_users` (website accounts). A
// Minecraft player can appear on the leaderboards with no site account at
// all, so deleting them here is what actually pulls them off the
// leaderboards/rankings — deleting a `noble_users` account (see
// /api/admin/users) does not touch this table.
export const Route = createFileRoute("/api/admin/players")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const admin = await getUserFromRequest(conn, request);
          if (!admin || admin.role !== "admin") {
            return Response.json(
              { ok: false, error: "Admins only." },
              { status: 403 },
            );
          }

          const [rows] = await conn.execute<any[]>(
            `SELECT
              p.uuid, p.username, p.kills, p.deaths, p.hidden,
              COALESCE(u.elo, 0) AS uhc_elo,
              COALESCE(s.elo, 0) AS sword_elo,
              COALESCE(d.elo, 0) AS dpot_elo
            FROM noble_players p
            LEFT JOIN noble_uhc_elo   u ON u.uuid = p.uuid
            LEFT JOIN noble_sword_elo s ON s.uuid = p.uuid
            LEFT JOIN noble_dpot_elo  d ON d.uuid = p.uuid
            ORDER BY p.username ASC
            LIMIT 500`,
          );
          return Response.json({ ok: true, players: rows });
        } catch (err: any) {
          console.error("Admin players GET error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
      // Permanently hides (or unhides) a player from the public
      // leaderboards. Unlike DELETE below, this survives NobleSync
      // re-syncing that player's stats — exactly what you want for a bot
      // that's still actively racking up kills in-game.
      PATCH: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const admin = await getUserFromRequest(conn, request);
          if (!admin || admin.role !== "admin") {
            return Response.json(
              { ok: false, error: "Admins only." },
              { status: 403 },
            );
          }

          const body = await request.json().catch(() => null);
          const uuid = typeof body?.uuid === "string" ? body.uuid : null;
          const hidden = typeof body?.hidden === "boolean" ? body.hidden : null;
          if (!uuid || hidden === null) {
            return Response.json(
              { ok: false, error: "Missing uuid or hidden." },
              { status: 400 },
            );
          }

          await conn.execute("UPDATE noble_players SET hidden = ? WHERE uuid = ?", [
            hidden ? 1 : 0,
            uuid,
          ]);

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Admin players PATCH error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
      DELETE: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const admin = await getUserFromRequest(conn, request);
          if (!admin || admin.role !== "admin") {
            return Response.json(
              { ok: false, error: "Admins only." },
              { status: 403 },
            );
          }

          const body = await request.json().catch(() => null);
          const uuid = typeof body?.uuid === "string" ? body.uuid : null;
          if (!uuid) {
            return Response.json(
              { ok: false, error: "Missing uuid." },
              { status: 400 },
            );
          }

          // Wipes the player from every leaderboard: base stats plus all
          // three per-mode tables. NobleSync will simply recreate these
          // rows from scratch next sync if the player logs back in and
          // gets new stats, so this is a "remove from the boards right
          // now" action, not a permanent server-side ban.
          await conn.execute("DELETE FROM noble_players WHERE uuid = ?", [
            uuid,
          ]);
          await conn.execute("DELETE FROM noble_uhc_elo WHERE uuid = ?", [
            uuid,
          ]);
          await conn.execute("DELETE FROM noble_sword_elo WHERE uuid = ?", [
            uuid,
          ]);
          await conn.execute("DELETE FROM noble_dpot_elo WHERE uuid = ?", [
            uuid,
          ]);

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Admin players DELETE error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
    },
  },
});
