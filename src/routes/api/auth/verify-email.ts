import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";

export const Route = createFileRoute("/api/auth/verify-email")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let conn;
        try {
          const token = new URL(request.url).searchParams.get("token");
          if (!token) {
            return Response.redirect(
              new URL("/login?verify=missing", request.url),
              302,
            );
          }

          conn = await getConnection();

          const [rows] = await conn.execute<any[]>(
            "SELECT user_id FROM noble_email_verifications WHERE token = ? AND expires_at > NOW() LIMIT 1",
            [token],
          );
          const row = rows[0];
          if (!row) {
            return Response.redirect(
              new URL("/login?verify=invalid", request.url),
              302,
            );
          }

          await conn.execute(
            "UPDATE noble_users SET email_verified = 1 WHERE id = ?",
            [row.user_id],
          );
          await conn.execute(
            "DELETE FROM noble_email_verifications WHERE token = ?",
            [token],
          );

          return Response.redirect(
            new URL("/login?verify=success", request.url),
            302,
          );
        } catch (err: any) {
          console.error("Verify email error:", err);
          return Response.redirect(
            new URL("/login?verify=error", request.url),
            302,
          );
        } finally {
          conn?.end();
        }
      },
    },
  },
});
