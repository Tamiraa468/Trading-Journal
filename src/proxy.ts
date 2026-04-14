import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AUTH_COOKIE_NAME, shouldUseSecureCookie, verifyJwtToken } from "@/lib/jwt";

const PREVIEW_MODE = process.env.TRADEJOURNAL_PREVIEW_MODE === "1";
const PROTECTED_PREFIXES = ["/dashboard", "/api/trades"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const payload = await verifyJwtToken(token);
    const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!sub) return false;

    const rows = await db.$queryRaw<Array<{ passwordUpdatedAt: Date | null }>>`
      SELECT "passwordUpdatedAt"
      FROM "User"
      WHERE "id" = ${sub}
      LIMIT 1
    `;
    const user = rows[0];
    if (!user) return false;

    const issuedAt =
      typeof payload.iat === "number" && Number.isFinite(payload.iat)
        ? Math.floor(payload.iat)
        : null;

    if (
      issuedAt &&
      user.passwordUpdatedAt &&
      issuedAt < Math.floor(user.passwordUpdatedAt.getTime() / 1000)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export default async function proxy(req: NextRequest) {
  if (PREVIEW_MODE) {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;
  const hasSessionCookie = req.cookies.has(AUTH_COOKIE_NAME);
  const validSession = await hasValidSession(req);

  if (isProtectedPath(pathname) && !validSession) {
    if (pathname.startsWith("/api/")) {
      const unauthorized = new NextResponse("Unauthorized", { status: 401 });
      if (hasSessionCookie) clearSessionCookie(unauthorized);
      return unauthorized;
    }

    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    const redirect = NextResponse.redirect(signInUrl);
    if (hasSessionCookie) clearSessionCookie(redirect);
    return redirect;
  }

  if (isAuthPage(pathname) && validSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API/TRPC
    "/(api|trpc)(.*)",
  ],
};