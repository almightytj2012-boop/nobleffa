import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/users")({
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
            "SELECT id, username, email, role, created_at, email_verified, mc_username FROM noble_users ORDER BY created_at DESC LIMIT 500",
          );
          return Response.json({ ok: true, users: rows });
        } catch (err: any) {
          console.error("Admin users GET error:", err);
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
          const userId = Number(body?.userId);
          const role =
            body?.role === "admin"
              ? "admin"
              : body?.role === "user"
                ? "user"
                : null;
          if (!userId || !role) {
            return Response.json(
              { ok: false, error: "Missing userId or role." },
              { status: 400 },
            );
          }

          if (role === "admin") {
            const [targetRows] = await conn.execute<any[]>(
              "SELECT email_verified, mc_username FROM noble_users WHERE id = ?",
              [userId],
            );
            const target = targetRows[0];
            if (!target) {
              return Response.json(
                { ok: false, error: "User not found." },
                { status: 404 },
              );
            }
            if (!target.email_verified || !target.mc_username) {
              return Response.json(
                {
                  ok: false,
                  error:
                    "That account needs a verified email and a linked Minecraft account before it can be made admin.",
                },
                { status: 400 },
              );
            }
          }

          await conn.execute("UPDATE noble_users SET role = ? WHERE id = ?", [
            role,
            userId,
          ]);
          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Admin users PATCH error:", err);
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
          const userId = Number(body?.userId);
          if (!userId) {
            return Response.json(
              { ok: false, error: "Missing userId." },
              { status: 400 },
            );
          }
          if (userId === admin.id) {
            return Response.json(
              { ok: false, error: "You can't delete your own account." },
              { status: 400 },
            );
          }

          // noble_sessions and noble_orders both FK to noble_users with
          // ON DELETE CASCADE, so this cleanly removes the account, every
          // session it's logged into, and its store order history in one go.
          const [result]: any = await conn.execute(
            "DELETE FROM noble_users WHERE id = ?",
            [userId],
          );
          if (!result.affectedRows) {
            return Response.json(
              { ok: false, error: "User not found." },
              { status: 404 },
            );
          }

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Admin users DELETE error:", err);
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
