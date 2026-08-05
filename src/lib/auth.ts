import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Connection } from "mysql2/promise";

export const SESSION_COOKIE = "noble_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: "user" | "admin";
  email_verified: boolean;
  mc_username: string | null;
};

/* ---------- Passwords ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/* ---------- Cookies ---------- */

export function parseCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookieHeader(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    process.env["NODE_ENV"] === "production" ? "; Secure" : ""
  }`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/* ---------- Sessions (DB backed so logout / revocation is real) ---------- */

export async function createSession(
  conn: Connection,
  userId: number,
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await conn.execute(
    "INSERT INTO noble_sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    [token, userId, expiresAt],
  );
  return token;
}

export async function destroySession(
  conn: Connection,
  token: string,
): Promise<void> {
  await conn.execute("DELETE FROM noble_sessions WHERE token = ?", [token]);
}

export async function getUserFromRequest(
  conn: Connection,
  request: Request,
): Promise<SessionUser | null> {
  const token = parseCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const [rows] = await conn.execute<any[]>(
    `SELECT u.id, u.username, u.email, u.role, u.email_verified, u.mc_username
     FROM noble_sessions s
     JOIN noble_users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [token],
  );

  return (rows[0] as SessionUser | undefined) ?? null;
}
