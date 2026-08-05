# Noble Dashboard

Build a complete web application for my Minecraft PvP server called **Noble**.

IMPORTANT: Do NOT build a corporate website, school website, SaaS landing page, or a page with a giant hero section. This is NOT a marketing website. Build a modern gaming dashboard similar to MCTiers with a premium black and gold theme. The homepage should immediately display rankings, server information, and navigation. The landing section should take up no more than 15-20% of the screen.

Design Style:

• Premium dark theme

• Black (#090909) with metallic gold accents (#C9A65B)

• Modern glassmorphism

• Rounded corners

• Smooth hover animations

• Soft glows

• Beautiful icons

• Professional esports UI

• Fast, clean, minimal

• Similar quality to MCTiers, FACEIT, Discord, Steam, and Valorant Career pages.

TOP NAVIGATION

• Noble Logo

• Home

• Rankings

• Store

• Leaderboards

• Cosmetics

• Discord

• Search Players

• Login

Below the navbar create gamemode tabs exactly like MCTiers:

Overall

Sword

Diamond Pot

Netherite Pot

UHC

Crystal

Axe

Mace

SMP

The main content should be a large leaderboard table occupying most of the page.

Columns:

#

Player

Region

Rank

Current Elo

Highest Elo

Wins

Losses

Win Rate

Each player row should include:

• Minecraft Head

• Username

• Rank Badge

• Clan Tag

• Region Badge

• Current Elo

• Hover Animation

• Clickable Profile

Create filters for:

• Region

• Gamemode

• Rank

• Search Player

PLAYER PROFILE PAGE

Each player has a profile displaying:

• Minecraft Skin

• Username

• Current Rank

• Current Elo

• Highest Elo

• Kills

• Deaths

• KDR

• Win Rate

• Playtime

• Clan

• Friends

• Match History

• Rank History

• Statistics Graph

• Current Season

• Achievements

SERVER PANEL

Display live:

• Server Status

• Players Online

• Ping

• TPS

• Version

• Uptime

• Latest Announcement

STORE

Create a premium store connected to the Minecraft server.

Ranks:

VIP

• 25% Cosmetic Discount

• Chat Prefix

• Chat Color

MVP

• 50% Cosmetic Discount

• Extra Cosmetics

• Better Chat Features

MVP+

• 100% Cosmetic Discount

• MVP+ Arena

• Animated Tag

• Exclusive Cosmetics

Elite

• Everything in MVP+

• Elite Arena

• Premium Effects

• Future Perks

Each rank should have a premium animated product card with price, features, and a Buy button.

Support:

• Stripe

• PayPal

• Apple Pay

• Google Pay

• Credit Card

Automatically sync purchases with LuckPerms.

Create a Cosmetics page displaying Trails, Tags, Particles, Kill Effects, Victory Effects, Emotes, and Titles.

Create a Leaderboards page for:

• Top Elo

• Most Kills

• Highest Killstreak

• Most Wins

• Most Playtime

• Top Clans

Include Discord integration showing online members, online staff, announcements, and a Join button.

Create Support pages for FAQ, Appeals, Bug Reports, Player Reports, Contact Staff, and Tickets.

Everything should feel like a polished gaming platform rather than a normal website. Prioritize dashboard functionality, competitive rankings, live server information, and the premium rank store. The design should immediately remind users of MCTiers but with a more luxurious black-and-gold identity, smoother animations, and a cleaner modern interface.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nobleffa.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8ebc676-01eb-4bb0-b36b-309a0bbccc57).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Connecting Tebex (rank purchases)

The store's checkout uses Tebex's **Headless API** (no special compliance
approval needed, unlike Tebex's separate "Checkout API"):

1. In the [Tebex Creator dashboard](https://creator.tebex.io), create one
   package per rank under **Store → Packages**, and note each package's
   numeric ID (visible in its settings / the URL).
2. Open `src/lib/noble-data.ts` and set the real `tebexPackageId` for each
   entry in `STORE_RANKS` — they're `0` (placeholder) until you do.
3. Find your **webstore identifier** (Creator dashboard → Store →
   general settings) and set it as `TEBEX_WEBSTORE_TOKEN` in your server's
   environment.
4. Under **Developers → Webhooks → Endpoints**, add
   `https://your-domain/api/store/webhook`, subscribe it to at least
   `payment.completed`, then set the webhook secret shown there as
   `TEBEX_WEBHOOK_SECRET` in your environment. Click **Validate** on that
   page afterward — the webhook route responds to Tebex's validation
   ping automatically.
5. Run `sql/004_tebex.sql` against your database (adds one column to
   `noble_orders` to track the Tebex basket).

Without `TEBEX_WEBSTORE_TOKEN` set, checkout still records the order as
`pending` in `/admin` so nothing is silently lost, but it won't send the
buyer anywhere to actually pay — set the env vars above to accept real
payments.

