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
  <body style="margin:0;padding:24px;background:#ffffff;color:#111827;font-family:Outfit,Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;margin:0 auto;">
      <tr>
        <td style="padding:0;">
          <div style="border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;background:#ffffff;">
            <div style="padding:28px 28px 18px 28px;text-align:center;">
              <p style="margin:0;color:#2563eb;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;">
                NOMAD TRADERS
              </p>
              <h1 style="margin:16px 0 10px;font-size:46px;line-height:1.1;color:#111827;">${args.title}</h1>
              <p style="margin:0 auto;max-width:560px;color:#4b5563;font-size:16px;line-height:1.65;">${args.subtitle}</p>
            </div>

            <div style="padding:22px 28px 26px 28px;text-align:center;">
              <p style="margin:0 0 14px;color:#64748b;font-size:13px;letter-spacing:.1em;text-transform:uppercase;">Your 6-digit code</p>

              <div style="margin:0 auto;max-width:430px;padding:26px 20px;border-radius:14px;background:#f1f5f9;color:#0f172a;font-size:52px;font-weight:800;letter-spacing:0.22em;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;">
                ${args.code}
              </div>

              <p style="margin:20px auto 0;max-width:560px;color:#475569;font-size:16px;line-height:1.65;">
                This code remains active for <strong style="color:#111827;">${args.expiresMinutes} minutes</strong>.
              </p>
              <p style="margin:10px auto 0;max-width:560px;color:#6b7280;font-size:15px;line-height:1.65;">
                ${args.hint}
              </p>
            </div>

            <div style="padding:18px 28px 22px 28px;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:13px;line-height:1.65;">
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
    subject: `NOMAD Traders verification code`,
    html: renderEmailLayout({
      title: "Verify your email",
      subtitle:
        "Welcome to NOMAD Traders. Confirm your account to continue with secure sign in.",
      code: args.code,
      expiresMinutes: args.expiresMinutes,
      hint: "Enter this code on the verification page to activate your account.",
    }),
    text: [
      "NOMAD Traders - Verify your email",
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
    subject: `NOMAD Traders password reset code`,
    html: renderEmailLayout({
      title: "Reset your password",
      subtitle:
        "Use this one-time code to create a new password for your NOMAD Traders account.",
      code: args.code,
      expiresMinutes: args.expiresMinutes,
      hint: "Never share this code with anyone. NOMAD Traders support will never ask for it.",
    }),
    text: [
      "NOMAD Traders - Reset your password",
      `Reset code: ${args.code}`,
      `Expires in: ${args.expiresMinutes} minutes`,
      "Never share this code with anyone.",
      "If you did not request this email, you can ignore it.",
    ].join("\n"),
  };
}
