import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();

    const [fresh, syncedTrades] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          mt5Login: true,
          mt5Server: true,
          syncToken: true,
          syncEnabled: true,
          lastSyncAt: true,
        },
      }),
      db.trade.count({ where: { userId: user.id, source: "MT5_SYNC" } }),
    ]);

    const connected = Boolean(fresh?.syncEnabled && fresh?.mt5Login);

    return Response.json({
      connected,
      broker: fresh?.mt5Server ?? null,
      login: fresh?.mt5Login ?? null,
      lastSync: fresh?.lastSyncAt ?? null,
      syncedTrades,
      syncToken: fresh?.syncToken ?? null,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("mt5/status error");
    return new Response("Server error", { status: 500 });
  }
}
