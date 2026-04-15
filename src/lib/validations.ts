import { z } from "zod";

export const authEmailSchema = z
  .string()
  .trim()
  .email("Invalid email")
  .transform((v) => v.toLowerCase());

export const authPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const signInSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  email: authEmailSchema,
  name: z
    .string()
    .trim()
    .max(100, "Name is too long")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const sixDigitCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Code must be exactly 6 digits");

export const verifyEmailCodeSchema = z.object({
  email: authEmailSchema,
  code: sixDigitCodeSchema,
  password: authPasswordSchema,
});

export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;

export const resendEmailCodeSchema = z.object({
  email: authEmailSchema,
});

export type ResendEmailCodeInput = z.infer<typeof resendEmailCodeSchema>;

export const forgotPasswordSchema = z.object({
  email: authEmailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: authEmailSchema,
  code: sixDigitCodeSchema,
  newPassword: authPasswordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const STRATEGIES = [
  "Breakout",
  "Reversal",
  "Momentum",
  "Scalp",
  "Swing",
  "Gap Fill",
  "VWAP",
  "Other",
] as const;

export type StrategyName = (typeof STRATEGIES)[number];

export const sideSchema = z.enum(["LONG", "SHORT"]);

export const createTradeSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "Ticker required")
    .max(10, "Ticker too long")
    .transform((v) => v.toUpperCase()),
  side: sideSchema,
  entryPrice: z.coerce.number().positive("Entry price must be positive"),
  exitPrice: z.coerce.number().positive("Exit price must be positive"),
  quantity: z.coerce.number().int().positive().default(100),
  date: z
    .string()
    .min(1, "Date required")
    .transform((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
      return d;
    }),
  strategy: z.string().trim().max(50).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  notes: z.string().trim().max(500).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

export type CreateTradeInput = z.infer<typeof createTradeSchema>;

export const updateTradeSchema = createTradeSchema.partial();
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;

export function calculatePnl(args: {
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
}): number {
  const dir = args.side === "LONG" ? 1 : -1;
  return Math.round((args.exitPrice - args.entryPrice) * args.quantity * dir * 100) / 100;
}
