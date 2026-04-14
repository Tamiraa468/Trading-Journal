"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.38 3.61v2.99h3.85c2.25-2.07 3.58-5.11 3.58-8.63z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.85-2.99c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.97H1.27v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.28A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.55.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.78 1.27 5.37l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.82l3.45-3.45C17.95 1.16 15.24 0 12 0A12 12 0 0 0 1.27 6.63l3.98 3.09c.94-2.86 3.61-4.95 6.75-4.95z"
      />
    </svg>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = useMemo(() => {
    const raw = searchParams.get("next") || "/dashboard";
    if (!raw.startsWith("/") || raw.startsWith("//")) {
      return "/dashboard";
    }
    if (raw.startsWith("/\\") || raw.includes("\\")) {
      return "/dashboard";
    }
    if (raw.includes("\n") || raw.includes("\r")) {
      return "/dashboard";
    }
    return raw;
  }, [searchParams]);

  const googleAuthUrl = useMemo(
    () => `/api/auth/google?next=${encodeURIComponent(nextPath)}`,
    [nextPath],
  );

  const signUpUrl = useMemo(
    () => `/sign-up?next=${encodeURIComponent(nextPath)}`,
    [nextPath],
  );

  const forgotPasswordUrl = useMemo(
    () => `/sign-in/forgot-password?next=${encodeURIComponent(nextPath)}`,
    [nextPath],
  );

  const verifyEmailUrl = useMemo(() => {
    if (!unverifiedEmail) return null;
    return `/sign-up/verify?email=${encodeURIComponent(unverifiedEmail)}&next=${encodeURIComponent(nextPath)}`;
  }, [unverifiedEmail, nextPath]);

  const resetSuccess = useMemo(
    () => searchParams.get("reset") === "1",
    [searchParams],
  );

  const oauthError = useMemo(() => {
    const code = searchParams.get("error");

    switch (code) {
      case "google_denied":
        return "Google нэвтрэлтийг цуцалсан байна. Дахин оролдоно уу.";
      case "google_state":
        return "Google нэвтрэлтийн баталгаажуулалт амжилтгүй боллоо. Дахин оролдоно уу.";
      case "google_conflict":
        return "Энэ и-мэйл өөр нэвтрэх аргаар бүртгэгдсэн байна. И-мэйл, нууц үгээрээ нэвтэрнэ үү.";
      case "google_failed":
        return "Google-ээр нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.";
      default:
        return null;
    }
  }, [searchParams]);

  const displayError = error ?? oauthError;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("И-мэйл болон нууц үгээ оруулна уу.");
      return;
    }

    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; code?: string }
          | null;

        if (data?.code === "EMAIL_UNVERIFIED") {
          setUnverifiedEmail(normalizedEmail);
          throw new Error(
            "И-мэйл баталгаажаагүй байна. Майлд очсон 6 оронтой кодоор баталгаажуулна уу.",
          );
        }

        throw new Error(data?.error || "Нэвтрэх мэдээлэл буруу байна.");
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Нэвтрэх үед алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="stat-card w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-txt-muted">
          И-мэйл болон нууц үгээр нэвтэрнэ. Session JWT-г сервер автоматаар үүсгэнэ.
        </p>

        {resetSuccess && (
          <div className="mt-4 rounded-md border border-win/30 bg-win/10 px-3 py-2 text-sm text-win">
            Нууц үг шинэчлэгдлээ. Шинэ нууц үгээрээ нэвтэрнэ үү.
          </div>
        )}

        <Link href={googleAuthUrl} className="btn-ghost mt-5 w-full">
          <GoogleLogo />
          Continue with Google
        </Link>

        <div className="mt-4 flex items-center gap-3 text-xs text-txt-dim">
          <span className="h-px flex-1 bg-border" />
          <span>or use email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="password">
                Password
              </label>
              <Link href={forgotPasswordUrl} className="text-[11px] text-accent">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {displayError && (
            <div className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {displayError}
            </div>
          )}

          {verifyEmailUrl && (
            <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
              <Link href={verifyEmailUrl}>И-мэйл баталгаажуулах код оруулах</Link>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-xs text-txt-dim font-mono">
          No account yet? <Link href={signUpUrl} className="text-accent">Create account</Link>.
        </div>
      </div>
    </div>
  );
}
