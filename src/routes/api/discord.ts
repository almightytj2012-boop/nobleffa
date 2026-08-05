import { createFileRoute } from "@tanstack/react-router";

// Discord invite code from the server's invite link (discord.gg/<code>).
// Change this if the invite link ever changes.
const INVITE_CODE = "mMKQWsXcuZ";

export const Route = createFileRoute("/api/discord")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // This is Discord's public, unauthenticated invite-resolve
          // endpoint — no bot token required. `with_counts=true` gets us
          // approximate total member count + approximate online count.
          const res = await fetch(
            `https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true&with_expiration=true`,
          );

          if (!res.ok) {
            return Response.json(
              { ok: false, error: `Discord returned ${res.status}` },
              { status: 502 },
            );
          }

          const data = await res.json();

          return Response.json({
            ok: true,
            name: data?.guild?.name ?? "Noble",
            icon: data?.guild?.icon
              ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png`
              : null,
            members: data?.approximate_member_count ?? 0,
            online: data?.approximate_presence_count ?? 0,
            invite: `https://discord.gg/${INVITE_CODE}`,
          });
        } catch (err: any) {
          console.error("Discord API error:", err);
          return Response.json(
            { ok: false, error: "Something went wrong." },
            { status: 500 },
          );
        }
      },
    },
  },
});
