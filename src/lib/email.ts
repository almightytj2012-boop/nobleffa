// Minimal email sender using Resend's HTTP API directly (no SDK dependency
// to install). Set RESEND_API_KEY and RESEND_FROM in your environment
// (e.g. RESEND_FROM="Noble <noreply@yourdomain.com>").
//
// If RESEND_API_KEY isn't set, this logs the email to the console instead
// of throwing, so local development and any server that hasn't configured
// email yet don't break — but verification links obviously won't be
// delivered anywhere in that case.

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["RESEND_FROM"] ?? "Noble <noreply@noble.local>";

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — would have sent "${subject}" to ${to}:\n${html}`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[email] Resend send failed (${res.status}): ${text}`);
  }
}

export function verificationEmailHtml(username: string, verifyUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your Noble account</h2>
      <p>Hey ${escapeHtml(username)}, confirm this email address to finish setting up your account.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#d4af37;color:#111;text-decoration:none;border-radius:8px;font-weight:bold;">Verify email</a></p>
      <p style="color:#888;font-size:12px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
