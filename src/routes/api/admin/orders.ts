import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/orders")({
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
            `SELECT o.id, o.rank_id, o.rank_name, o.amount, o.status, o.created_at,
                    u.username, u.email
             FROM noble_orders o
             JOIN noble_users u ON u.id = o.user_id
             ORDER BY o.created_at DESC
             LIMIT 500`,
          );
          return Response.json({ ok: true, orders: rows });
        } catch (err: any) {
          console.error("Admin orders GET error:", err);
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
          const orderId = Number(body?.orderId);
          const status = ["pending", "paid", "fulfilled", "cancelled"].includes(
            body?.status,
          )
            ? body.status
            : null;
          if (!orderId || !status) {
            return Response.json(
              { ok: false, error: "Missing orderId or status." },
              { status: 400 },
            );
          }

          await conn.execute(
            "UPDATE noble_orders SET status = ? WHERE id = ?",
            [status, orderId],
          );
          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Admin orders PATCH error:", err);
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
