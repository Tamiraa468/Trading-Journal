"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

function sanitizeNextPath(raw: string | null): string {
  const value = raw || "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/\\") || value.includes("\\")) return "/dashboard";
  if (value.includes("\n") || value.includes("\r")) return "/dashboard";
  return value;
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRequestCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("И-мэйлээ оруулна уу.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/password/forgot", {
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
        throw new Error(data?.error || "Код илгээх үед алдаа гарлаа.");
      }

      setEmail(normalizedEmail);
      setStep("reset");
      setInfo("Хэрэв бүртгэл байгаа бол 6 оронтой код майл руу илгээгдлээ.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Код илгээх үед алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
      setError("И-мэйл болон 6 оронтой кодоо зөв оруулна уу.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгт байна.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Нууц үг давхар оруулсан утгатай таарахгүй байна.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code: normalizedCode,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Нууц үг сэргээх үед алдаа гарлаа.");
      }

      router.push(`/sign-in?reset=1&next=${encodeURIComponent(nextPath)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Нууц үг сэргээх үед алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="stat-card w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="mt-2 text-sm text-txt-muted">
          {step === "request"
            ? "6 оронтой сэргээх кодыг майл руу илгээнэ."
            : "Код болон шинэ нууц үгээ оруулаад нууц үгээ сэргээнэ."}
        </p>

        {step === "request" ? (
          <form onSubmit={onRequestCode} className="mt-6 space-y-4">
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
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={onResetPassword} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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

            <div>
              <label className="label" htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                className="input-field"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input-field"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
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
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <div className="mt-5 text-xs text-txt-dim font-mono">
          <Link href={`/sign-in?next=${encodeURIComponent(nextPath)}`} className="text-accent">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="stat-card w-full max-w-md text-sm text-txt-muted">Loading...</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
