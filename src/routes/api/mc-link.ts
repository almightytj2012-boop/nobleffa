import { createFileRoute } from "@tanstack/react-router";
import { randomInt } from "node:crypto";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// Flow:
//  1. POST here (logged in) -> generates a 6-character code, stores it in
//     noble_mc_link_codes tied to the caller's account, returns the code.
//  2. The player runs `/noblelink <code>` in-game. A Bukkit plugin with DB
//     access (see NobleSync's LinkCommand) writes claimed_uuid /
//     claimed_username / claimed_at onto that row.
//  3. GET here (logged in) -> checks whether the caller's latest code has
//     been claimed. If so, and that Minecraft account isn't already linked
//     to someone else, it finalizes the link onto noble_users and returns
//     the linked username.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return code;
}

export const Route = createFileRoute("/api/mc-link")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const user = await getUserFromRequest(conn, request);
          if (!user) {
            return Response.json(
              { ok: false, error: "Sign in first." },
              { status: 401 },
            );
          }

          const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

          // Small retry loop in case of a rare code collision.
          for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateCode();
            try {
              await conn.execute(
                "INSERT INTO noble_mc_link_codes (code, user_id, expires_at) VALUES (?, ?, ?)",
                [code, user.id, expiresAt],
              );
              return Response.json({
                ok: true,
                code,
                expiresAt: expiresAt.toISOString(),
              });
            } catch (err: any) {
              if (err?.code !== "ER_DUP_ENTRY") throw err;
            }
          }

          return Response.json(
            { ok: false, error: "Couldn't generate a code, try again." },
            { status: 500 },
          );
        } catch (err: any) {
          console.error("mc-link POST error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        } finally {
          conn?.end();
        }
      },
      GET: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const user = await getUserFromRequest(conn, request);
          if (!user) {
            return Response.json(
              { ok: false, error: "Sign in first." },
              { status: 401 },
            );
          }

          if (user.mc_username) {
            return Response.json({
              ok: true,
              linked: true,
              mc_username: user.mc_username,
            });
          }

          const [rows] = await conn.execute<any[]>(
            `SELECT code, claimed_uuid, claimed_username
             FROM noble_mc_link_codes
             WHERE user_id = ? AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [user.id],
          );
          const pending = rows[0];
          if (!pending) {
            return Response.json({ ok: true, linked: false, pending: false });
          }
          if (!pending.claimed_uuid) {
            return Response.json({
              ok: true,
              linked: false,
              pending: true,
              code: pending.code,
            });
          }

          // Someone else may have linked that exact Minecraft account first
          // (e.g. two people racing the same code by accident, or a stale
          // claim). The UNIQUE key on mc_uuid is the real guard; this check
          // just gives a clean error message instead of a raw SQL failure.
          const [existing] = await conn.execute<any[]>(
            "SELECT id FROM noble_users WHERE mc_uuid = ? LIMIT 1",
            [pending.claimed_uuid],
          );
          if (existing.length) {
            return Response.json(
              {
                ok: false,
                error: "That Minecraft account is already linked to another Noble account.",
              },
              { status: 409 },
            );
          }

          await conn.execute(
            "UPDATE noble_users SET mc_uuid = ?, mc_username = ? WHERE id = ?",
            [pending.claimed_uuid, pending.claimed_username, user.id],
          );

          return Response.json({
            ok: true,
            linked: true,
            mc_username: pending.claimed_username,
          });
        } catch (err: any) {
          console.error("mc-link GET error:", err);
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
