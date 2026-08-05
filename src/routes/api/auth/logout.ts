import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import {
  clearSessionCookieHeader,
  destroySession,
  parseCookie,
  SESSION_COOKIE,
} from "@/lib/auth";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let conn;
        try {
          const token = parseCookie(request, SESSION_COOKIE);
          if (token) {
            conn = await getConnection();
            await destroySession(conn, token);
          }
          return Response.json(
            { ok: true },
            { headers: { "Set-Cookie": clearSessionCookieHeader() } },
          );
        } catch (err: any) {
          console.error("Logout API error:", err);
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
