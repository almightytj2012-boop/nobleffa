import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { getConnection } from "@/lib/db";
import { createSession, hashPassword, sessionCookieHeader } from "@/lib/auth";
import { sendEmail, verificationEmailHtml } from "@/lib/email";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let conn;
        try {
          const body = await request.json().catch(() => null);
          const username = String(body?.username ?? "").trim();
          const email = String(body?.email ?? "")
            .trim()
            .toLowerCase();
          const password = String(body?.password ?? "");

          if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
            return Response.json(
              {
                ok: false,
                error:
                  "Username must be 3-16 characters (letters, numbers, underscore).",
              },
              { status: 400 },
            );
          }
          if (!/^\S+@\S+\.\S+$/.test(email)) {
            return Response.json(
              { ok: false, error: "Enter a valid email." },
              { status: 400 },
            );
          }
          if (password.length < 8) {
            return Response.json(
              { ok: false, error: "Password must be at least 8 characters." },
              { status: 400 },
            );
          }

          conn = await getConnection();

          const [existing] = await conn.execute<any[]>(
            "SELECT id FROM noble_users WHERE username = ? OR email = ? LIMIT 1",
            [username, email],
          );
          if (existing.length) {
            return Response.json(
              { ok: false, error: "That username or email is already taken." },
              { status: 409 },
            );
          }

          // SECURITY FIX: this used to auto-promote whoever created the very
          // first account on the site to admin. That meant anyone who beat
          // you to registering — or re-registered after a DB wipe — could
          // become admin. Every new account is now a plain "user"; admin is
          // granted only from the admin panel, and only to accounts with a
          // verified email + a linked Minecraft account (see sql/003).
          const passwordHash = hashPassword(password);
          const [result] = await conn.execute<any>(
            "INSERT INTO noble_users (username, email, password_hash, role) VALUES (?, ?, ?, 'user')",
            [username, email, passwordHash],
          );

          const userId = result.insertId as number;
          const token = await createSession(conn, userId);

          // Verification email — best-effort. A failure here shouldn't block
          // account creation; the user can request a new link later.
          try {
            const verifyToken = randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await conn.execute(
              "INSERT INTO noble_email_verifications (token, user_id, expires_at) VALUES (?, ?, ?)",
              [verifyToken, userId, expiresAt],
            );
            const origin = new URL(request.url).origin;
            const verifyUrl = `${origin}/api/auth/verify-email?token=${verifyToken}`;
            await sendEmail(
              email,
              "Verify your Noble account",
              verificationEmailHtml(username, verifyUrl),
            );
          } catch (emailErr) {
            console.error("Failed to send verification email:", emailErr);
          }

          return Response.json(
            {
              ok: true,
              user: { id: userId, username, email, role: "user" as const },
            },
            { headers: { "Set-Cookie": sessionCookieHeader(token) } },
          );
        } catch (err: any) {
          console.error("Register API error:", err);
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
