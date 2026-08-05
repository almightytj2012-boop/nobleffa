import mysql from "mysql2/promise";

export function getDbConfig() {
  const missing = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
  return {
    host: process.env["DB_HOST"]!,
    port: Number(process.env["DB_PORT"] ?? 3306),
    user: process.env["DB_USER"]!,
    password: process.env["DB_PASSWORD"]!,
    database: process.env["DB_NAME"]!,
  };
}

export function getConnection() {
  // No timeout was set here before, so if MySQL is unreachable (wrong
  // host, firewall silently dropping packets, DB down) the connection
  // attempt just hangs forever with no error — which is why the admin
  // panel could get stuck on "Loading…" indefinitely instead of showing
  // an error. Capping it means a bad connection now fails loudly and
  // quickly instead of hanging the page.
  return mysql.createConnection({
    ...getDbConfig(),
    connectTimeout: 8000,
  });
}

/**
 * Wraps a query so it can never hang forever even once a connection is
 * successfully established — connectTimeout above only covers the initial
 * handshake, not a query that gets stuck after that (e.g. a lock wait on
 * a busy table). mysql2 doesn't apply a query timeout by default, so a
 * slow/stuck query would otherwise hang the whole request (and the page)
 * indefinitely with zero feedback.
 */
export async function queryWithTimeout<T = any>(
  conn: mysql.Connection,
  sql: string,
  params: any[] = [],
  timeoutMs = 8000,
): Promise<[T, any]> {
  return (await Promise.race([
    conn.execute(sql, params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timed out")), timeoutMs),
    ),
  ])) as [T, any];
}
