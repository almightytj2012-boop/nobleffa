import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { createSession, sessionCookieHeader, verifyPassword } from "@/lib/auth";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let conn;
        try {
          const body = await request.json().catch(() => null);
          const identifier = String(body?.identifier ?? "")
            .trim()
            .toLowerCase();
          const password = String(body?.password ?? "");

          if (!identifier || !password) {
            return Response.json(
              { ok: false, error: "Enter your email/username and password." },
              { status: 400 },
            );
          }

          conn = await getConnection();

          const [rows] = await conn.execute<any[]>(
            "SELECT id, username, email, password_hash, role FROM noble_users WHERE LOWER(username) = ? OR email = ? LIMIT 1",
            [identifier, identifier],
          );

          const user = rows[0];
          if (!user || !verifyPassword(password, user.password_hash)) {
            return Response.json(
              { ok: false, error: "Invalid credentials." },
              { status: 401 },
            );
          }

          const token = await createSession(conn, user.id);

          return Response.json(
            {
              ok: true,
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
              },
            },
            { headers: { "Set-Cookie": sessionCookieHeader(token) } },
          );
        } catch (err: any) {
          console.error("Login API error:", err);
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
