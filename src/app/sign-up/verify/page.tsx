"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";

function sanitizeNextPath(raw: string | null): string {
  const value = raw || "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/\\") || value.includes("\\")) return "/dashboard";
  if (value.includes("\n") || value.includes("\r")) return "/dashboard";
  return value;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );

  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  async function onVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
      setError("И-мэйл болон 6 оронтой кодоо зөв оруулна уу.");
      return;
    }

    if (password.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгт байна.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Нууц үг давхар оруулсан утгатай таарахгүй байна.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code: normalizedCode,
          password,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Код буруу эсвэл хугацаа дууссан байна.");
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Баталгаажуулах үед алдаа гарлаа.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (resending || cooldown > 0) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Код дахин илгээхийн тулд и-мэйл оруулна уу.");
      return;
    }

    setResending(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Код дахин илгээж чадсангүй.");
      }

      setInfo("Хэрэв бүртгэл байгаа бол шинэ код майл руу илгээгдлээ.");
      setCooldown(60);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Код дахин илгээх үед алдаа гарлаа.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="stat-card w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verify email</h1>
        <p className="mt-2 text-sm text-txt-muted">
          Бүртгэлээ идэвхжүүлэхийн тулд майлд очсон 6 оронтой кодыг оруулна уу.
        </p>

        <form onSubmit={onVerify} className="mt-6 space-y-4">
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
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="code">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              className="input-field"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
              {error}
            </div>
          )}

          {info && (
            <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
              {info}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify and continue"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-txt-dim font-mono">
          <button
            type="button"
            onClick={onResend}
            className="text-accent disabled:text-txt-dim"
            disabled={resending || cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
          </button>

          <Link href={`/sign-in?next=${encodeURIComponent(nextPath)}`} className="text-accent">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="stat-card w-full max-w-md text-sm text-txt-muted">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
