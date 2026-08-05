import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const user = await getUserFromRequest(conn, request);
          return Response.json({ ok: true, user });
        } catch (err: any) {
          console.error("Me API error:", err);
          return Response.json({ ok: true, user: null });
        } finally {
          conn?.end();
        }
      },
    },
  },
});
