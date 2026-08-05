import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const Route = createFileRoute("/api/settings/announcement")({
  server: {
    handlers: {
      GET: async () => {
        let conn;
        try {
          conn = await getConnection();
          const [rows] = await conn.execute<any[]>(
            "SELECT `value` FROM noble_settings WHERE `key` = 'announcement' LIMIT 1",
          );
          return Response.json({
            ok: true,
            announcement: rows[0]?.value ?? "",
          });
        } catch (err: any) {
          console.error("Announcement GET error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
      POST: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const user = await getUserFromRequest(conn, request);
          if (!user || user.role !== "admin") {
            return Response.json(
              { ok: false, error: "Admins only." },
              { status: 403 },
            );
          }

          const body = await request.json().catch(() => null);
          const text = String(body?.text ?? "").slice(0, 500);

          await conn.execute(
            "INSERT INTO noble_settings (`key`, `value`) VALUES ('announcement', ?) " +
              "ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
            [text],
          );

          return Response.json({ ok: true, announcement: text });
        } catch (err: any) {
          console.error("Announcement POST error:", err);
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
