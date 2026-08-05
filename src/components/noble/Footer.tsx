import { Link } from "@tanstack/react-router";
import { SERVER } from "@/lib/noble-data";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-border/70 bg-background/60">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 p-1.5">
              <img src="/brand/noble-logo.png" alt="" className="size-full object-contain" />
            </span>
            <span className="font-display text-lg font-bold uppercase tracking-[0.18em] gold-text">
              Noble
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Competitive Minecraft PvP. Ranked queues, verified tiers, and a season that actually
            means something.
          </p>
          <p className="mt-3 font-mono text-sm text-gold">{SERVER.ip}</p>
        </div>

        <FooterCol title="Compete">
          <FooterLink to="/rankings">Rankings</FooterLink>
          <FooterLink to="/leaderboards">Leaderboards</FooterLink>
          <FooterLink to="/discord">Discord</FooterLink>
        </FooterCol>

        <FooterCol title="Shop">
          <FooterLink to="/store">Ranks</FooterLink>
        </FooterCol>

        <FooterCol title="Support">
          <FooterLink to="/support">Help Center</FooterLink>
          <FooterLink to="/support">Appeals &amp; Tickets</FooterLink>
          <FooterLink to="/login">Account</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-border/60 px-4 py-5 text-center text-xs text-muted-foreground lg:px-8">
        © {new Date().getFullYear()} Noble Network. Not affiliated with Mojang AB or Microsoft.
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
