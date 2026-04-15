# Code Review: Auth Implementation (Next.js)
**Date**: 2026-04-14
**Ready for Production**: No
**Critical Issues**: 0

## Scope Reviewed
- API routes:
  - src/app/api/auth/register/route.ts
  - src/app/api/auth/verify-email/route.ts
  - src/app/api/auth/verify-email/resend/route.ts
  - src/app/api/auth/password/forgot/route.ts
  - src/app/api/auth/password/reset/route.ts
  - src/app/api/auth/session/route.ts
  - src/app/api/auth/google/route.ts
  - src/app/api/auth/google/callback/route.ts
- Core auth libraries:
  - src/lib/auth-email-code.ts
  - src/lib/session.ts
  - src/lib/jwt.ts
  - src/lib/auth.ts
  - src/lib/google-oauth.ts
- Frontend auth pages:
  - src/app/sign-in/[[...sign-in]]/page.tsx
  - src/app/sign-up/[[...sign-up]]/page.tsx
  - src/app/sign-up/verify/page.tsx
  - src/app/sign-in/forgot-password/page.tsx
- Access guard:
  - src/proxy.ts
- Data model:
  - prisma/schema.prisma
  - prisma/migrations/20260414170000_email_codes/migration.sql

## Threat Model Focus (Targeted Plan)
1. Authentication abuse resistance (brute force, credential stuffing, email-code abuse)
2. Session lifecycle (issuance, invalidation, replay window, cookie safety)
3. OAuth integrity (state, nonce, PKCE, callback hardening)
4. Account enumeration and takeover vectors
5. Query safety and authorization boundary checks

## Priority 1 (Must Fix) ⛔
### 1) Missing endpoint-level rate limiting and anti-automation on auth APIs (High)
**Evidence**
- src/app/api/auth/session/route.ts:91
- src/app/api/auth/register/route.ts:48
- src/app/api/auth/verify-email/route.ts:26
- src/app/api/auth/verify-email/resend/route.ts:37
- src/app/api/auth/password/forgot/route.ts:35
- src/app/api/auth/password/reset/route.ts:23
- Only account-based lockout exists in sign-in flow: src/app/api/auth/session/route.ts:8, src/app/api/auth/session/route.ts:9, src/app/api/auth/session/route.ts:38

**Exploit scenario**
- A botnet rotates IPs and usernames to bypass per-account lockout and perform credential stuffing.
- Attackers can repeatedly trigger forgot/resend to email-bomb targets and increase support load.

**Minimal fix**
- Add route-level limiter middleware (IP + normalized email key) for all auth endpoints.
- Add stricter budgets for code-issuance endpoints (per IP, per email, per /24).

### 2) Logout only clears cookie; stolen JWT remains usable until expiry (High)
**Evidence**
- Logout clears browser cookie only: src/app/api/auth/session/route.ts:218, src/app/api/auth/session/route.ts:224
- Default token TTL is 12h: src/lib/jwt.ts:6, src/lib/jwt.ts:39
- Auth accepts bearer tokens (not just cookie): src/lib/auth.ts:33, src/lib/auth.ts:38

**Exploit scenario**
- If a JWT is exfiltrated (browser compromise, logs, proxy leak), attacker can continue API access from another client until expiration, even after user logs out.

**Minimal fix**
- Add jti claim + server-side session table/denylist and revoke on logout.
- Optionally shorten JWT TTL and rotate refresh/session identifiers.

## Priority 2 (Should Fix Soon) ⚠️
### 3) Account enumeration via differential responses in register and verify-email (Medium)
**Evidence**
- Register returns 409 for existing non-pending account: src/app/api/auth/register/route.ts:105, src/app/api/auth/register/route.ts:148
- Register returns 202 for other cases: src/app/api/auth/register/route.ts:133, src/app/api/auth/register/route.ts:143
- Verify email reveals already verified status: src/app/api/auth/verify-email/route.ts:61
- Verify email otherwise returns generic invalid code: src/app/api/auth/verify-email/route.ts:54, src/app/api/auth/verify-email/route.ts:74

**Exploit scenario**
- Adversary probes email list and distinguishes existing/verified accounts to improve phishing and password-spray targeting.

**Minimal fix**
- Normalize external responses (always 202 + generic message).
- Keep specific states only in internal logs/telemetry.

### 4) OTP resend has no hard cap; attempts reset on each resend (Medium)
**Evidence**
- Cooldown exists: src/lib/auth-email-code.ts:121
- Resend resets attemptsLeft to max: src/lib/auth-email-code.ts:155
- sentCount increments but no enforcement: src/lib/auth-email-code.ts:157
- attemptsLeft initialized at max: src/lib/auth-email-code.ts:147

**Exploit scenario**
- Attackers can continue triggering code sends over long periods (email abuse/DoS), and reset attempt budget repeatedly.

**Minimal fix**
- Enforce max sends per rolling window using sentCount + createdAt/updatedAt.
- Keep attemptsLeft monotonic across active window unless prior code is fully expired.

### 5) OTP HMAC secret falls back to JWT secret (Medium)
**Evidence**
- src/lib/auth-email-code.ts:34

**Exploit scenario**
- Shared secret increases blast radius: compromise/mismanagement of one secret impacts both session and OTP integrity domains.

**Minimal fix**
- Require dedicated EMAIL_CODE_SECRET in all environments.
- Fail startup if EMAIL_CODE_SECRET is missing.

## Priority 3 (Hardening) ℹ️
### 6) JWT verification algorithm list is env-driven without strict allowlist (Low)
**Evidence**
- src/lib/jwt.ts:17
- src/lib/jwt.ts:34
- Signing is fixed HS256: src/lib/jwt.ts:73

**Exploit scenario**
- Misconfiguration can weaken verification posture or break auth unexpectedly.

**Minimal fix**
- Restrict verify algorithms to explicit hardcoded allowlist (HS256 only), or validate env values against strict allowlist.

### 7) Potential stale-session false negative on equality boundary (Low, availability)
**Evidence**
- Password set/update on verify flow: src/app/api/auth/verify-email/route.ts:87
- Session stale check uses <= in multiple places: src/lib/auth.ts:79, src/proxy.ts:47, src/app/api/auth/session/route.ts:200

**Exploit scenario**
- Session issued in same second as password update may be treated stale and dropped (forced re-login).

**Minimal fix**
- Compare with < instead of <=, or add slight issuance skew handling.

## Security Strengths Already Present ✅
- CSRF same-origin checks on sensitive auth mutations across register/login/verify/resend/forgot/reset/logout:
  - src/app/api/auth/register/route.ts:49
  - src/app/api/auth/session/route.ts:92
  - src/app/api/auth/session/route.ts:219
  - src/app/api/auth/verify-email/route.ts:27
  - src/app/api/auth/verify-email/resend/route.ts:38
  - src/app/api/auth/password/forgot/route.ts:36
  - src/app/api/auth/password/reset/route.ts:24
- Password hashing with bcrypt cost 12:
  - src/app/api/auth/verify-email/route.ts:83
  - src/app/api/auth/password/reset/route.ts:70
- Timing-safe checks for OAuth and OTP material:
  - src/lib/google-oauth.ts:232
  - src/lib/auth-email-code.ts:66
- OTP integrity controls:
  - hashed code storage and HMAC: src/lib/auth-email-code.ts:71
  - expiry/attempt tracking: src/lib/auth-email-code.ts:193, src/lib/auth-email-code.ts:215
  - schema/index support: prisma/schema.prisma:59, prisma/schema.prisma:60, prisma/schema.prisma:61
- Cookie hardening for auth session:
  - src/lib/session.ts:18, src/lib/session.ts:19, src/lib/session.ts:20
- Password-change session invalidation checks in API/proxy/server auth:
  - src/lib/auth.ts:79
  - src/proxy.ts:47
  - src/app/api/auth/session/route.ts:200
- OAuth hardening (state, nonce, PKCE, OIDC checks, email_verified):
  - src/app/api/auth/google/callback/route.ts:50
  - src/lib/google-oauth.ts:157
  - src/lib/google-oauth.ts:220
  - src/lib/google-oauth.ts:244, src/lib/google-oauth.ts:246
- Safe raw SQL usage (parameterized tagged templates) and no Unsafe raw calls detected.

## Go/No-Go
- **Verdict**: **No-Go** for production at current posture.
- Rationale: no route-level anti-automation controls and no server-side JWT revocation materially raise credential-stuffing and token-replay/account-takeover risk.
