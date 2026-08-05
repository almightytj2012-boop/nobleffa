import { createFileRoute } from "@tanstack/react-router";
import { createHmac, createHash } from "crypto";
import { getConnection } from "@/lib/db";

// Point a Tebex webhook (Creator dashboard → Developers → Webhooks →
// Endpoints) at https://your-domain/api/store/webhook, subscribed to at
// least "payment.completed". Requires TEBEX_WEBHOOK_SECRET to be set to
// the secret shown on that same page.
// Docs: https://docs.tebex.io/developers/webhooks/overview
export const Route = createFileRoute("/api/store/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env["TEBEX_WEBHOOK_SECRET"];
        if (!webhookSecret) {
          return Response.json(
            { ok: false, error: "Tebex webhooks aren't configured." },
            { status: 400 },
          );
        }

        // Tebex signs the raw request body — verifying against a parsed
        // and re-stringified copy would give a different hash and always
        // fail, so this reads the raw text first before doing anything else.
        const rawBody = await request.text();
        const signature = request.headers.get("x-signature") ?? "";

        const bodyHash = createHash("sha256").update(rawBody).digest("hex");
        const expectedSignature = createHmac("sha256", webhookSecret)
          .update(bodyHash)
          .digest("hex");

        if (signature !== expectedSignature) {
          return Response.json(
            { ok: false, error: "Invalid signature." },
            { status: 401 },
          );
        }

        let event: any;
        try {
          event = JSON.parse(rawBody);
        } catch {
          return Response.json(
            { ok: false, error: "Invalid JSON." },
            { status: 400 },
          );
        }

        // Tebex sends a one-time validation webhook when you first add the
        // endpoint — it must be echoed back exactly like this or the
        // endpoint never gets marked as validated in their dashboard.
        if (event.type === "validation.webhook") {
          return Response.json({ id: event.id });
        }

        let conn;
        try {
          if (event.type === "payment.completed") {
            // The orderId we stashed in `custom` when creating the basket
            // comes back here — this is what ties the payment back to a
            // specific row in noble_orders. Checked in a couple of
            // plausible spots since Tebex nests it slightly differently
            // depending on payment type.
            const orderId =
              event.subject?.custom?.orderId ??
              event.subject?.basket?.custom?.orderId ??
              null;
            const basketIdent =
              event.subject?.basket?.ident ?? event.subject?.transaction_id ?? null;

            conn = await getConnection();
            if (orderId) {
              await conn.execute(
                "UPDATE noble_orders SET status = 'paid' WHERE id = ?",
                [orderId],
              );
            } else if (basketIdent) {
              // Fallback in case `custom` didn't come through for some
              // reason — match on the basket ident we saved at checkout.
              await conn.execute(
                "UPDATE noble_orders SET status = 'paid' WHERE tebex_basket_ident = ?",
                [basketIdent],
              );
            } else {
              console.error(
                "Tebex payment.completed webhook had no orderId or basket ident:",
                JSON.stringify(event.subject),
              );
            }
          }

          return Response.json({ ok: true });
        } catch (err: any) {
          console.error("Tebex webhook error:", err);
          return Response.json(
            { ok: false, error: "Webhook error." },
            { status: 400 },
          );
        } finally {
          conn?.end();
        }
      },
    },
  },
});
