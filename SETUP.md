# Noble — Backend Setup

## Database

Run the existing stats-plugin schema, then apply the new migration:

```
mysql -u <user> -p <database> < sql/002_auth_store.sql
```

This adds `noble_users`, `noble_sessions`, `noble_orders`, and `noble_settings`
on top of the existing `noble_players` / `noble_*_elo` tables.

## Environment variables

Required (already in use by the leaderboard/player APIs):

```
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
```

New, for real payments (optional — without these, "Buy" still records a
pending order in `noble_orders` that an admin can mark as paid/fulfilled
from `/admin`):

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Point a Stripe webhook (event: `checkout.session.completed`) at
`https://your-domain/api/store/webhook` to have orders auto-marked as
`paid` when a real payment clears.

## Accounts & admin access

- Anyone can register from `/login` (toggle to "Register").
- The **first account ever created becomes an admin automatically**.
- Additional admins can be promoted from the admin panel (`/admin` → Users
  tab → "Make admin"), or by hand:
  ```sql
  UPDATE noble_users SET role = 'admin' WHERE username = 'YourName';
  ```
- `/admin` is gated — signed-out visitors are asked to sign in, and
  non-admins are told the page is admin-only.

## What the admin panel can do

- **Orders** — see every rank purchase (buyer, rank, amount, status) and
  change status between pending / paid / fulfilled / cancelled. Useful for
  manually fulfilling ranks in-game and for reviewing anything Stripe isn't
  wired up for yet.
- **Users** — see everyone with an account and promote/revoke admin access.
- **Announcement** — edit the text shown in the homepage Server Panel
  ("Latest Announcement"). Stored in `noble_settings` and public via
  `GET /api/settings/announcement`.

## Overall Elo

`Overall` elo shown across Rankings, Leaderboards, and player profiles is
now **Diamond Pot elo + UHC elo** (summed, not averaged). Sword has no elo
system, so it's shown separately per-mode but is not part of Overall.
