import { createFileRoute } from "@tanstack/react-router";
import { getConnection } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { STORE_RANKS } from "@/lib/noble-data";

// Tebex's Headless API — https://docs.tebex.io/developers/headless-api/overview
// Works with packages you've already created in your webstore (Creator
// dashboard → Store → Packages), no special Tebex compliance approval
// needed (unlike the separate "Checkout API", which does require that).
const TEBEX_HEADLESS_BASE = "https://headless.tebex.io/api";

export const Route = createFileRoute("/api/store/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let conn;
        try {
          conn = await getConnection();
          const user = await getUserFromRequest(conn, request);
          if (!user) {
            return Response.json(
              { ok: false, error: "Sign in first to buy a rank." },
              { status: 401 },
            );
          }

          const body = await request.json().catch(() => null);
          const rank = STORE_RANKS.find((r) => r.id === body?.rankId);
          if (!rank) {
            return Response.json(
              { ok: false, error: "Unknown rank." },
              { status: 400 },
            );
          }

          const webstoreToken = process.env["TEBEX_WEBSTORE_TOKEN"];
          if (!webstoreToken) {
            return Response.json(
              {
                ok: false,
                error:
                  "The store isn't connected to Tebex yet — set TEBEX_WEBSTORE_TOKEN (your webstore identifier from the Tebex Creator dashboard) on the server.",
              },
              { status: 400 },
            );
          }
          if (!rank.tebexPackageId) {
            return Response.json(
              {
                ok: false,
                error: `${rank.name} isn't linked to a Tebex package yet — set its tebexPackageId in noble-data.ts.`,
              },
              { status: 400 },
            );
          }

          const [result] = await conn.execute<any>(
            "INSERT INTO noble_orders (user_id, rank_id, rank_name, amount, status) VALUES (?, ?, ?, ?, 'pending')",
            [user.id, rank.id, rank.name, rank.price],
          );
          const orderId = result.insertId as number;
          const origin = new URL(request.url).origin;

          try {
            // 1. Create a basket. `custom.orderId` round-trips back to us
            // on the webhook so we know exactly which order to mark paid —
            // no separate lookup table needed.
            const basketRes = await fetch(
              `${TEBEX_HEADLESS_BASE}/accounts/${webstoreToken}/baskets`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  complete_url: `${origin}/store?checkout=success`,
                  cancel_url: `${origin}/store?checkout=cancelled`,
                  complete_auto_redirect: true,
                  custom: { orderId: String(orderId) },
                  // Pre-fills the Minecraft username on Tebex's checkout
                  // page if the account already has one linked.
                  ...(user.mc_username ? { username: user.mc_username } : {}),
                }),
              },
            );
            const basketJson: any = await basketRes.json().catch(() => null);
            const basketIdent = basketJson?.data?.ident;
            if (!basketRes.ok || !basketIdent) {
              throw new Error(
                basketJson?.detail ?? basketJson?.error ?? "Failed to create Tebex basket",
              );
            }

            // 2. Add the rank's package to that basket.
            const addRes = await fetch(
              `${TEBEX_HEADLESS_BASE}/baskets/${basketIdent}/packages`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  package_id: rank.tebexPackageId,
                  quantity: 1,
                }),
              },
            );
            const addJson: any = await addRes.json().catch(() => null);
            const checkoutUrl = addJson?.data?.links?.checkout;
            if (!addRes.ok || !checkoutUrl) {
              throw new Error(
                addJson?.detail ?? addJson?.error ?? "Failed to add package to Tebex basket",
              );
            }

            await conn.execute(
              "UPDATE noble_orders SET tebex_basket_ident = ? WHERE id = ?",
              [basketIdent, orderId],
            );

            return Response.json({ ok: true, checkoutUrl });
          } catch (tebexErr) {
            console.error("Tebex checkout error:", tebexErr);
            return Response.json({
              ok: true,
              checkoutUrl: null,
              message:
                "Payment provider error. Your order was recorded as pending for manual review.",
            });
          }
        } catch (err: any) {
          console.error("Checkout API error:", err);
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
