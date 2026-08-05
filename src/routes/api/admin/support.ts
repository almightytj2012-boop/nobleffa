import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/support")({
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
            `SELECT id, mc_username, kind, subject, message, status, created_at
             FROM noble_support_tickets
             ORDER BY FIELD(status, 'open', 'in_review', 'resolved'), created_at DESC
             LIMIT 200`,
          );
          return Response.json({ ok: true, tickets: rows });
        } catch (err: any) {
          console.error("Admin support GET error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
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
          const ticketId = Number.isFinite(body?.ticketId) ? Number(body.ticketId) : null;
          const status = ["open", "in_review", "resolved"].includes(body?.status)
            ? body.status
            : null;
          if (!ticketId || !status) {
            return Response.json(
              { ok: false, error: "Missing ticketId or status." },
              { status: 400 },
            );
          }

          await conn.execute("UPDATE noble_support_tickets SET status = ? WHERE id = ?", [
            status,
            ticketId,
          ]);

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Admin support PATCH error:", err);
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
