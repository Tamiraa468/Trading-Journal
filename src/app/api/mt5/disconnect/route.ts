import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { mt5DisconnectSchema } from "@/lib/mt5-validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = mt5DisconnectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        mt5Login: null,
        mt5Server: null,
        mt5InvestorPass: null,
        syncToken: null,
        syncEnabled: false,
      },
    });

    return Response.json({ disconnected: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("mt5/disconnect error");
    return new Response("Server error", { status: 500 });
  }
}
