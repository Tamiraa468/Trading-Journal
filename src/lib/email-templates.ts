type CodeEmailTemplateArgs = {
  code: string;
  expiresMinutes: number;
};

type BuiltEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function renderEmailLayout(args: {
  title: string;
  subtitle: string;
  code: string;
  expiresMinutes: number;
  hint: string;
}): string {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${args.title}</title>
  </head>
  <body style="margin:0;padding:24px;background:#0b0e11;color:#e4e8ef;font-family:Outfit,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
      <tr>
        <td style="padding:0;">
          <div style="border:1px solid #1e2738;border-radius:12px;overflow:hidden;background:#12161c;">
            <div style="padding:20px 24px;border-bottom:1px solid #1e2738;background:linear-gradient(135deg,#0f1522 0%,#12161c 100%);">
              <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(42,122,255,0.15);border:1px solid rgba(42,122,255,0.4);color:#2a7aff;font-weight:600;font-size:12px;letter-spacing:.06em;">
                TRADEJOURNAL
              </div>
              <h1 style="margin:14px 0 8px;font-size:26px;line-height:1.2;color:#e4e8ef;">${args.title}</h1>
              <p style="margin:0;color:#6b7a90;font-size:14px;line-height:1.6;">${args.subtitle}</p>
            </div>

            <div style="padding:24px;">
              <p style="margin:0 0 12px;color:#6b7a90;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Your 6-digit code</p>
              <div style="display:inline-block;padding:14px 18px;border-radius:10px;border:1px solid #1e2738;background:#181d25;color:#2a7aff;font-size:28px;font-weight:700;letter-spacing:0.2em;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;">
                ${args.code}
              </div>

              <p style="margin:16px 0 0;color:#6b7a90;font-size:14px;line-height:1.6;">
                This code expires in <strong style="color:#e4e8ef;">${args.expiresMinutes} minutes</strong>.
              </p>
              <p style="margin:8px 0 0;color:#6b7a90;font-size:14px;line-height:1.6;">
                ${args.hint}
              </p>
            </div>

            <div style="padding:16px 24px;border-top:1px solid #1e2738;background:#10141b;color:#3d4a5c;font-size:12px;line-height:1.6;">
              If you did not request this email, you can safely ignore it.
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export function buildEmailVerificationTemplate(
  args: CodeEmailTemplateArgs,
): BuiltEmailTemplate {
  return {
    subject: `TradeJournal verification code: ${args.code}`,
    html: renderEmailLayout({
      title: "Verify your email",
      subtitle:
        "Welcome to TradeJournal. Confirm your account to continue with secure sign in.",
      code: args.code,
      expiresMinutes: args.expiresMinutes,
      hint: "Enter this code on the verification page to activate your account.",
    }),
    text: [
      "TradeJournal - Verify your email",
      `Verification code: ${args.code}`,
      `Expires in: ${args.expiresMinutes} minutes`,
      "Enter this code on the verification page to activate your account.",
      "If you did not request this email, you can ignore it.",
    ].join("\n"),
  };
}

export function buildPasswordResetTemplate(
  args: CodeEmailTemplateArgs,
): BuiltEmailTemplate {
  return {
    subject: `TradeJournal password reset code: ${args.code}`,
    html: renderEmailLayout({
      title: "Reset your password",
      subtitle:
        "Use this one-time code to create a new password for your TradeJournal account.",
      code: args.code,
      expiresMinutes: args.expiresMinutes,
      hint: "Never share this code with anyone. TradeJournal support will never ask for it.",
    }),
    text: [
      "TradeJournal - Reset your password",
      `Reset code: ${args.code}`,
      `Expires in: ${args.expiresMinutes} minutes`,
      "Never share this code with anyone.",
      "If you did not request this email, you can ignore it.",
    ].join("\n"),
  };
}
