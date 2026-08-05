-- Adds Tebex basket tracking to noble_orders. Safe to run multiple times.
-- The old stripe_session_id column is left in place (unused) rather than
-- dropped, so this doesn't touch any existing order history.

ALTER TABLE noble_orders
  ADD COLUMN IF NOT EXISTS tebex_basket_ident VARCHAR(64);

ALTER TABLE noble_orders
  ADD INDEX IF NOT EXISTS idx_noble_orders_tebex_basket (tebex_basket_ident);
