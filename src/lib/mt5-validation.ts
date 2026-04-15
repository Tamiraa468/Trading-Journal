import { z } from "zod";

export const mt5ConnectSchema = z.object({
  login: z
    .string()
    .min(4, "Login must be at least 4 digits")
    .max(12, "Login too long")
    .regex(/^\d+$/, "Login must be numeric only"),
  server: z
    .string()
    .min(3, "Server name too short")
    .max(50, "Server name too long")
    .regex(/^[a-zA-Z0-9\-]+$/, "Server name can only contain letters, numbers, hyphens"),
  password: z.string().min(4, "Password too short").max(64, "Password too long"),
});
export type Mt5ConnectInput = z.infer<typeof mt5ConnectSchema>;

export const mt5DealSchema = z.object({
  ticket: z.string().min(1).max(50),
  symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9.]+$/, "Symbol must be uppercase letters/digits/dots"),
  side: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  profit: z.number(),
  volume: z.number().positive().max(1000),
  swap: z.number().optional().default(0),
  commission: z.number().optional().default(0),
  positionId: z.string().optional(),
  time: z.number().int().positive(),
  magic: z.number().int().optional().default(0),
  comment: z.string().max(200).optional().default(""),
});
export type Mt5DealInput = z.infer<typeof mt5DealSchema>;

export const mt5PushSchema = z.object({
  token: z.string().min(10).max(100).optional(),
  userId: z.string().min(1).optional(),
  deal: mt5DealSchema,
});
export type Mt5PushInput = z.infer<typeof mt5PushSchema>;

export const mt5DisconnectSchema = z.object({
  confirmDelete: z.literal(true),
});
