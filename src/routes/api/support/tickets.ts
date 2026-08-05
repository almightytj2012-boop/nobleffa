import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const Route = createFileRoute("/api/support/tickets")({
  server: {
    handlers: {
      // Signed-in users see their own ticket history.
      GET: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const user = await getUserFromRequest(conn, request);
          if (!user) {
            return Response.json(
              { ok: false, error: "Sign in to view your tickets." },
              { status: 401 },
            );
          }

          const [rows] = await conn.execute<any[]>(
            `SELECT id, kind, subject, status, created_at, updated_at
             FROM noble_support_tickets
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 100`,
            [user.id],
          );
          return Response.json({ ok: true, tickets: rows });
        } catch (err: any) {
          console.error("Support tickets GET error:", err);
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
          // Signing in isn't required to submit — being locked out of your
          // account (e.g. a ban appeal) is exactly when you'd need this
          // most — but we still attach the account if one's signed in, so
          // staff can cross-reference it.
          const user = await getUserFromRequest(conn, request).catch(() => null);

          const body = await request.json().catch(() => null);
          const kind = typeof body?.kind === "string" ? body.kind.slice(0, 32) : null;
          const mcUsername =
            typeof body?.mcUsername === "string" ? body.mcUsername.trim().slice(0, 64) : "";
          const subject =
            typeof body?.subject === "string" ? body.subject.trim().slice(0, 255) : "";
          const message = typeof body?.message === "string" ? body.message.trim() : "";

          if (!kind || !mcUsername || !subject || !message) {
            return Response.json(
              { ok: false, error: "Fill in every field." },
              { status: 400 },
            );
          }

          const [result] = await conn.execute<any>(
            `INSERT INTO noble_support_tickets (user_id, mc_username, kind, subject, message)
             VALUES (?, ?, ?, ?, ?)`,
            [user?.id ?? null, mcUsername, kind, subject, message],
          );

          return Response.json({ ok: true, ticketId: result.insertId });
        } catch (err: any) {
          console.error("Support tickets POST error:", err);
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
