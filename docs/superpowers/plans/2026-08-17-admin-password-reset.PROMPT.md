# Master Prompt — Admin Password Reset

Paste the block below into a fresh session. It is self-contained: it carries the
audit of the existing auth system, the traps that will silently break this
feature, the design decisions already made, and the success criteria — so the
agent does not need to re-derive anything.

Everything asserted in the prompt was verified against the working tree at
`d9f0324` on 2026-08-17. File:line references are real.

---

## The prompt

````markdown
You are working in `D:\Antigravity\thoughts-whatever` — a Next.js 14.2.35 App
Router site (Bengali literary publication) on Vercel, with Prisma 6 against
Supabase Postgres through the pgbouncer pooler, Jest for unit tests, Playwright
for e2e, and tsx for scripts.

Build a **forgot-password / reset-password flow for the admin account**, so the
single editor can recover access by email without database access.

Work task by task, in order, using the superpowers:subagent-driven-development
skill (or superpowers:executing-plans). Commit after every task; do not batch.

## Task 1 is a live security hole. Fix and deploy it before anything else.

`src/app/api/admin/login/route.ts:64-72` contains an unauthenticated admin
takeover:

```ts
// Auto-bootstrap primary admin account if matching password [REDACTED_OLD_BACKDOOR]
if ((!admin || !(await verifyPassword(parsed.data.password, admin.passwordHash))) && parsed.data.password === "[REDACTED_OLD_BACKDOOR]") {
  const passwordHash = await hashPassword("[REDACTED_OLD_BACKDOOR]");
  admin = await prisma.adminUser.upsert({
    where: { email: "admin@thoughts.whatever.com" },
    create: { email: "admin@thoughts.whatever.com", passwordHash, nameBn: "অ্যাডমিন" },
    update: { passwordHash, nameBn: "অ্যাডমিন" },
  });
}
```

Trace it: POST any email at all plus the password `[REDACTED_OLD_BACKDOOR]`. The lookup
misses (or the password mismatches), so the guard passes, the `upsert` **writes
`hash("[REDACTED_OLD_BACKDOOR]")` over the real admin's `passwordHash`**, and `admin` is
reassigned to that row. The `verifyPassword` check three lines below then
compares `"[REDACTED_OLD_BACKDOOR]"` against the hash it just wrote, succeeds, and
`issueAuthCookies` hands the caller a valid 30-day admin session.

`/api/admin/login` is the one path `src/middleware.ts:67-69` explicitly excludes
from the auth gate, so there is nothing in front of it. The repo is **public**
(`https://github.com/Diganta18-noob/Thoughts-Whatever`), so the password is
world-readable — in the route, and again in `docs/PROMPT_HISTORY.md` at lines
49, 76, and 239.

Note what this does to the feature you are about to build: while that block
exists, the admin password is not a secret and cannot be made one, because any
failed login attempt by anyone silently resets it. A reset flow shipped on top
of it is decoration. Deploy Task 1 on its own first.

`scripts/hash-password.ts` documents the invariant the block violates — "not
having [a sign-up page] means there is no way in that isn't this script with
database access." Restore that invariant.

## What already exists — reuse it, do not rebuild it

Read these before writing anything.

- **`src/lib/auth.ts`** — the whole session layer. `hashPassword` (bcrypt cost
  12), `verifyPassword`, `issueAuthCookies`, `clearAuthCookies`, `readSession`,
  `requireAdmin`, and refresh-token rotation with reuse detection. Cookies:
  `tw_access` (15 min), `tw_refresh` (30 days), legacy `tw_session`; JWTs are
  HS256 over `AUTH_SECRET`. Do **not** add NextAuth or any other auth library —
  it would mean rewriting login, middleware, and the cookie contract, and this
  system already works and has tests.
- **`src/app/api/admin/settings/route.ts:68-104`** — the authenticated
  change-password action. Its final write is the exact transaction your reset
  endpoint must perform:

  ```ts
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { passwordHash: newHash } }),
    prisma.refreshToken.updateMany({ where: { adminUserId: id }, data: { revoked: true } }),
  ]);
  ```

  A reset that does not revoke refresh tokens leaves an attacker's 30-day
  session alive after the victim "recovers" the account.
- **`src/lib/rate-limit.ts`** — `rateLimit(identifier, { windowMs, max })` and
  `getClientIp(request)`. Used by the login route at `:32`.
- **`src/lib/audit.ts:129`** — `auditAuthAction(action, extra)` writing to the
  `AuditLog` model. Its `action` union is `"login" | "logout" | "login_failed"`;
  widen it, and extend the summary ternary, rather than bypassing the helper.
- **`src/lib/validation.ts:148`** — `loginSchema`, Zod 4, with Bengali messages
  (`z.email("সঠিক ইমেল দিন")`, min 8 → `"পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে"`).
  New schemas belong in this file and must match that voice.
- **Nodemailer transport, already written twice** — identically, at
  `src/lib/automation/notifications/email-report.ts:9` and
  `src/lib/system/notifications.ts:5`, both reading
  `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD`. All four are set in
  `.env`. Neither existing sender can address an arbitrary recipient — both send
  only to `NOTIFICATION_EMAIL_TO`. Extract the transport once; do not write a
  third copy.
- **`scripts/hash-password.ts`** (`npm run admin:hash -- email "password"`) —
  the existing out-of-band recovery path. It is the lockout escape hatch for
  this whole feature; keep it working and mention it in the docs task.
- **`src/app/admin/login/`** — `page.tsx` (with `robots: { index: false }`),
  `login-chrome.tsx` (reusable header), `login-form.tsx`. Test ids in use:
  `email-input`, `password-input`, `login-submit`, `login-error`. Match that
  markup and Tailwind vocabulary (`border-rule`, `text-content`, `bg-accent`) —
  the new pages should be indistinguishable in style from the login page.

## Five traps, each verified. Any one of them silently breaks this feature.

1. **Middleware will make your new pages unreachable.** `src/middleware.ts:67`
   allowlists public admin paths by *exact string equality* on `/admin/login`
   and `/api/admin/login`, then gates everything else under `/admin` and
   `/api/admin` (matcher at `:122`). A logged-out visitor — the entire audience
   for this feature — gets redirected to login, and the API returns 401. All
   four new paths must be added to that allowlist.
2. **`?token=` in the URL is exfiltrated to PostHog.**
   `src/components/analytics/page-view-tracker.tsx:16-19` appends the full query
   string to `$current_url` and captures it, and `:33` shows admin paths are in
   scope. A reset token in the query string therefore lands in a third-party
   analytics store. Read the token on mount, then `router.replace()` to a
   token-free URL before anything captures a pageview — or keep the token out of
   `searchParams` entirely.
3. **Never build the reset link from the request headers.** Use
   `process.env.NEXT_PUBLIC_SITE_URL`. Deriving the origin from the `Host` or
   `X-Forwarded-Host` header lets an attacker who can trigger a reset for a
   known email receive a link pointing at their own domain.
4. **New i18n keys must be added to BOTH `locales/en.json` and
   `locales/bn.json`.** They are flat dot-notation maps, 323 keys each, loaded
   by `src/lib/i18n/{en,bn}.ts`. `interpolate()` in
   `src/components/providers/language-provider.tsx:36` falls back to returning
   the key itself, so a missing key renders the literal string
   `admin.forgot.submit` on screen instead of throwing. Existing `admin.login.*`
   values are English in both files; follow that.
5. **The rate limiter is per-instance and in-memory.**
   `src/lib/rate-limit.ts` is a module-level `Map`, so on Vercel each lambda has
   its own and a cold start resets it. Use it — consistency with the login route
   matters more than perfection here — but do not let it be the only thing
   standing between an attacker and unlimited token guesses. Short expiry, single
   use, and 256 bits of entropy are what actually carry that load.

Also: `src/app/api/admin/login/route.ts:60` does
`rawEmail.replace("whatver.com", "whatever.com")`, silently aliasing two
distinct email addresses onto one account. Low severity with a single admin, but
it is identity-key rewriting and it should not survive into a flow where the
email address *is* the recovery channel. Remove it in Task 1.

## Design decisions — already made, implement as specified

- **Opaque random token, hashed at rest. Not a JWT.** Mint with
  `crypto.randomBytes(32).toString("base64url")`; store only
  `crypto.createHash("sha256").update(raw).digest("hex")`. A JWT here would be
  self-validating, so revocation and single-use would need a database record
  anyway — and a leaked `AUTH_SECRET` would mint resets for any account. The
  lookup is a unique-index hit on the hash, so there is no secret comparison and
  no timing concern.
- **30-minute expiry. Single use.** `usedAt` is stamped inside the same
  `$transaction` as the password write, so a replayed link cannot land twice.
- **Requesting a new link invalidates the account's earlier unused ones.** Only
  the newest link works.
- **No user enumeration.** `POST /api/admin/forgot-password` returns the same
  200 and the same body whether or not the email exists, and burns comparable
  time either way. The login route already does exactly this with its
  `throwawayHash()` dummy compare at `:11-15` — mirror that idea.
- **Never log, audit, or email-subject the raw token.** Audit the *event*, with
  the email and IP.
- **Fail loudly when SMTP is unconfigured.** Both existing senders return
  `false` and log a warning. That silent-fallback pattern is precisely what
  caused this project's cover-image disaster (see
  `docs/PERFORMANCE_MEASUREMENTS.md`) — an upload route that fell back to
  storing a 3 MB data URI rather than erroring. The reset request endpoint must
  return a 5xx if it cannot send mail, so a broken recovery path is visible
  instead of appearing to work.

## The tasks

1. **Close the takeover.** Delete the auto-bootstrap block at
   `src/app/api/admin/login/route.ts:64-72` and the `whatver.com` rewrite at
   `:60`. Delete `src/app/api/admin/init-account/` outright — it resets the
   primary admin's password to the same constant, and it is dead weight (it sits
   behind the middleware gate, so it is not the open door the login route is,
   but it must not survive either). Replace the literal in `prisma/seed.ts:659`
   with a required `SEED_ADMIN_PASSWORD` env read that exits non-zero when
   unset, and in `e2e/auth.setup.ts:13` with a required `TEST_ADMIN_PASSWORD`
   (both currently default to the backdoor, so e2e will break loudly otherwise —
   that is the point). Scrub `docs/PROMPT_HISTORY.md` lines 49, 76, 239. Add a
   route test — `src/lib/__tests__/cover-route.test.ts` is the precedent for
   testing a handler — asserting that a nonexistent email plus `[REDACTED_OLD_BACKDOOR]`
   returns 401 and writes no `AdminUser` row. Then set a real password via
   `npm run admin:hash` and rotate `AUTH_SECRET` (which invalidates every
   existing session, including any an attacker already holds).
2. **Open the middleware allowlist** for `/admin/forgot-password`,
   `/admin/reset-password`, `/api/admin/forgot-password`, and
   `/api/admin/reset-password`. Turn the two-way `||` at `src/middleware.ts:67`
   into a `Set` lookup. Unit-test that each new path passes through and that
   `/admin` and `/api/admin/pieces` still do not. Land this early: allowlisting
   a route that does not exist yet is harmless, and it lets you verify each
   endpoint by hand as it lands.
3. **Add the `PasswordResetToken` model.** Fields: `id`, `tokenHash` (unique),
   `adminUserId` (relation to `AdminUser`, `onDelete: Cascade`), `expiresAt`,
   `usedAt?`, `createdAt`, `requestedIp?`, `requestedUserAgent?`; index
   `adminUserId`. Add the back-relation on `AdminUser`
   (`prisma/schema.prisma:201-209`) and change nothing else about existing
   models. Run `npx tsx scripts/export-full-db.ts` first and confirm the file
   exists. There is no `prisma/migrations` directory — this repo uses the push
   workflow, so apply with `npx prisma db push` (it goes through `DIRECT_URL`,
   bypassing pgbouncer) and then `npx prisma generate`.
4. **`src/lib/password-reset.ts`** — `createResetToken(adminUserId, meta)`
   returning the raw token, `hashResetToken(raw)`, and `consumeResetToken(raw)`
   returning the owning user or a typed reason (`not-found` / `expired` /
   `already-used`). This is the security core and the most testable unit in the
   feature: cover the happy path, an expired token, a reused token, an unknown
   token, and the invalidation of a prior unused token.
5. **`src/lib/mailer.ts`** — one shared transport, extracted from the two
   duplicates, plus `sendMail({ to, subject, html, text })` that throws when
   SMTP is unconfigured, and `sendPasswordResetEmail(to, resetUrl)`. Repoint
   both existing notification senders at the shared transport, keeping their
   tolerant "skip and warn" behaviour for reports — a missed nightly report is
   not a lockout. Bilingual copy, a plain-text alternative alongside the HTML,
   and the expiry stated in the body.
6. **`POST /api/admin/forgot-password`** — Zod-validated email, rate limited on
   both `forgot:{ip}` and `forgot:{email}` (3 per hour), always 200, dummy work
   on unknown addresses, link built from `NEXT_PUBLIC_SITE_URL`, audited, 5xx
   only when the mailer itself fails.
7. **`POST /api/admin/reset-password`** — token plus new password (reuse the
   Bengali 8-character message), rate limited on `reset:{ip}` (10 per 15 min),
   and on success the three-statement transaction from Task 0's reference:
   update `passwordHash`, stamp `usedAt`, revoke every refresh token for that
   user. Audited. Distinct, non-leaky errors for expired versus already-used.
8. **The UI.** `/admin/forgot-password` and `/admin/reset-password` pages, each
   reusing `LoginChrome` and carrying `robots: { index: false, follow: false }`;
   a "Forgot your password?" link added to `login-form.tsx`; new keys in both
   locale files; test ids following the existing convention
   (`forgot-email-input`, `forgot-submit`, `reset-password-input`,
   `reset-submit`, and matching error ids). Strip the token from the URL on
   mount per trap 2. Success states must say a link was sent *if the address
   exists* — the page must not confirm the account.
9. **Verify and document.** An e2e spec `e2e/07-password-reset.spec.ts` covering
   request → consume → login with the new password → confirm the old password
   now fails and the old session is dead. Then `npx tsc --noEmit`,
   `npm run lint`, `npx jest`, and `npm run build` — all four green, with output
   quoted, not summarised. Record the flow, the closed hole, and
   `npm run admin:hash` as the escape hatch in `docs/AUTH.md`.

## Hard constraints

- Deploy Task 1 by itself, before the feature. It is a live hole in a public
  repo.
- Do **not** add a public sign-up page, and do not add a second way in. This
  site has one editor by design.
- Do **not** add NextAuth or another auth library.
- The schema change is additive only: one new model plus one back-relation.
  Back up first with `npx tsx scripts/export-full-db.ts` and confirm the file
  exists. Do not touch `Piece`, `Series`, or their cover columns — a large,
  recent, measured migration lives there.
- Never log, audit, or email-subject a raw reset token.
- A successful reset must revoke every refresh token for that user.
- Reuse `src/lib/rate-limit.ts`, `src/lib/audit.ts`, `src/lib/validation.ts`,
  and `src/lib/auth.ts`'s `hashPassword`. No parallel implementations.
- Unit tests go in `src/**/__tests__/*.test.ts`, run under
  `jest-environment-node` with the `@/` → `src/` alias, via `npx jest <path>`.
  Note `next.config.js` sets `typescript.ignoreBuildErrors` and
  `eslint.ignoreDuringBuilds`, so `npm run build` passing proves neither — run
  `npx tsc --noEmit` and `npm run lint` explicitly.
- Every new i18n key goes in `locales/en.json` **and** `locales/bn.json`.
- Commit after every task.

## Definition of done

- `grep -rn "[REDACTED_OLD_BACKDOOR]" src scripts e2e prisma docs` returns nothing.
- `src/app/api/admin/init-account/` does not exist.
- POST `/api/admin/login` with any email and the old backdoor password returns
  401 and creates no row — asserted by a test, not by inspection.
- A logged-out browser can reach `/admin/forgot-password` and
  `/admin/reset-password` without being redirected (this is trap 1; verify it in
  a real browser against `next start`, not only in tests).
- The end-to-end loop works against a local `next start`: request a link,
  receive the email, follow it, set a new password, sign in with it.
- The same link fails on second use, and a token older than 30 minutes fails.
- After a reset, a session established before it is rejected.
- Requesting a reset for an address with no account returns the same status and
  body as one that exists.
- No raw token appears in `AuditLog`, in server logs, or in any PostHog event.
- `npx tsc --noEmit`, `npm run lint`, `npx jest`, `npm run build`, and
  `npm run test:e2e` all pass.

If any of the audited claims above turns out not to hold, stop and say so
rather than working around it. Every one was verified against the working tree
at commit `d9f0324`, so a contradiction means something changed and is worth
surfacing.
````

---

## Task summary

| # | Task | Type | Risk |
|---|---|---|---|
| 1 | Close the unauthenticated admin takeover | **security** | **ship alone, first** |
| 2 | Middleware allowlist for the new public paths | code | low — **without it the feature is unreachable** |
| 3 | `PasswordResetToken` model | **schema** | needs backup + `db push` |
| 4 | `src/lib/password-reset.ts` — mint / verify / consume | code | low — the security core, most testable |
| 5 | `src/lib/mailer.ts` — shared transport, arbitrary recipient | code | medium — depends on SMTP reaching Vercel |
| 6 | `POST /api/admin/forgot-password` | code | low |
| 7 | `POST /api/admin/reset-password` | code | low |
| 8 | Forgot + reset pages, login link, i18n keys | UI | low |
| 9 | e2e, gates, `docs/AUTH.md` | verification | none |

Task 1 is not optional and is not part of the feature — it is the reason the
feature is currently meaningless. Tasks 3-7 are the flow itself; 8 is its
surface; 2 and 9 are what keep it from being quietly broken.

## What was verified while writing this

| Claim | Evidence |
|---|---|
| Backdoor grants a session and overwrites the real hash | `src/app/api/admin/login/route.ts:64-72`, traced through `verifyPassword` at `:74-76` |
| Nothing gates it | `src/middleware.ts:67-69` exact-match allowlist |
| The password is public | repo returns 200 unauthenticated from `api.github.com`; literal also in `docs/PROMPT_HISTORY.md:49,76,239` |
| `init-account` is gated, but resets to the same constant | `src/app/api/admin/init-account/route.ts:9`; matcher at `src/middleware.ts:122` |
| No reset model exists | `grep "model "` over `prisma/schema.prisma` — 12 models, none for tokens |
| Change-password already revokes sessions | `src/app/api/admin/settings/route.ts:92-101` |
| SMTP is configured and nodemailer is installed | `.env` has all four vars; `nodemailer@^9.0.4` in `package.json` |
| Transport is duplicated, recipient is fixed | `automation/notifications/email-report.ts:9` and `system/notifications.ts:5`, both sending only to `NOTIFICATION_EMAIL_TO` |
| Query strings reach PostHog | `src/components/analytics/page-view-tracker.tsx:16-19`, admin in scope at `:33` |
| Missing i18n keys render as the key | `src/components/providers/language-provider.tsx:36` |
| Rate limiter is per-instance | module-level `Map` in `src/lib/rate-limit.ts:11` |
| Push workflow, not migrations | no `prisma/migrations`; `directUrl` set at `prisma/schema.prisma:11` |
| e2e and seed depend on the backdoor | `e2e/auth.setup.ts:13`, `prisma/seed.ts:659` |
