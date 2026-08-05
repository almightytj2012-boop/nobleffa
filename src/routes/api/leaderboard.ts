import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";

export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      GET: async () => {
        let conn;
        try {
          conn = await getConnection();

          const [rows] = await conn.execute<any[]>(`
            SELECT
              p.uuid,
              p.username,
              p.kills,
              p.deaths,
              p.killstreak,
              p.maxkillstreak,
              COALESCE(u.elo, 0)   AS uhc_elo,
              COALESCE(s.elo, 0)   AS sword_elo,
              COALESCE(d.elo, 0)   AS dpot_elo,
              (
                COALESCE(u.elo, 0) +
                COALESCE(d.elo, 0)
              ) AS peak_elo
            FROM noble_players p
            LEFT JOIN noble_uhc_elo   u ON u.uuid = p.uuid
            LEFT JOIN noble_sword_elo s ON s.uuid = p.uuid
            LEFT JOIN noble_dpot_elo  d ON d.uuid = p.uuid
            WHERE p.hidden = 0
            ORDER BY peak_elo DESC
            LIMIT 100
          `);

          return Response.json({ ok: true, players: rows });
        } catch (err: any) {
          console.error("Leaderboard API error:", err);
          return Response.json(
            { ok: false, error: err.message },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
    },
  },
});
