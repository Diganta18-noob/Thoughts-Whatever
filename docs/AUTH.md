# Authentication & Password Recovery Architecture — Thoughts Whatever

## 1. Overview & Security Invariants

Thoughts Whatever is a single-editor publication. The authentication architecture enforces strict access control invariants:

- **No Public Registration**: There is no public user registration. The editor account is unique.
- **Session Layer**: JWT HS256 authentication cookies (`tw_access` valid for 15 minutes, `tw_refresh` with rolling 30-day database rotation and automatic theft detection).
- **Out-of-band Escape Hatch**: Database administrators can always create or recover the admin account offline without web access using:
  ```bash
  npm run admin:hash -- you@example.com "your-strong-password" "আপনার নাম"
  ```
- **Session Invalidation**: Rotating `AUTH_SECRET` immediately invalidates all active sessions. Resetting a password automatically revokes all refresh tokens.

---

## 2. Remediation of Legacy Vulnerability

In previous versions, an insecure auto-bootstrap block in `/api/admin/login` allowed overwriting the admin credentials if a specific static string was supplied. 

**Remediation Applied**:
- Removed the hardcoded credentials check and auto-bootstrapping from `POST /api/admin/login`.
- Removed `POST /api/admin/init-account`.
- Required `SEED_ADMIN_PASSWORD` in `prisma/seed.ts` and `TEST_ADMIN_PASSWORD` in `e2e/auth.setup.ts`.
- Removed legacy email domain rewriting.
- Redacted historical references across documentation and prompt logs.

---

## 3. Password Reset / Recovery System

The password recovery system allows the single administrator to recover account access via verified email dispatch.

### 3.1 Security Architecture
1. **Opaque 256-bit Tokens Hashed at Rest**:
   - Random token generated using `crypto.randomBytes(32).toString("base64url")`.
   - Stored in database as a SHA-256 digest (`tokenHash`).
   - The plaintext token is never logged, audited, or stored in the database.
2. **30-Minute Expiry & Single-Use**:
   - Tokens expire after 30 minutes.
   - Requesting a new reset link immediately invalidates previous unused tokens for the user.
   - Consuming a token stamps `usedAt` in the same atomic database transaction as the password hash update.
3. **Session Revocation on Reset**:
   - When a password is reset, all active `RefreshToken` rows for that admin are set to `revoked: true`, immediately killing all existing sessions.
4. **Anti-Enumeration Timing & Privacy**:
   - `POST /api/admin/forgot-password` always returns 200 `{ ok: true }` and executes equivalent work (dummy timing compare) even if the address is unknown.
   - UI confirms that a link was sent *if the address exists* without revealing user existence.
5. **URL Privacy (Analytics Leak Prevention)**:
   - On mounting `/admin/reset-password`, the `?token=` parameter is immediately read into memory state and stripped from the browser URL (`window.history.replaceState`), preventing analytics trackers (e.g. PostHog) from capturing the reset token.
6. **Dual Rate Limiting**:
   - In-memory rate limiting applied to both IP (`forgot:ip:{ip}`) and email (`forgot:email:{email}`).

---

## 4. Endpoints & Routes

| Path | Access | Description |
|---|---|---|
| `/admin/login` | Public | Admin login interface with "Forgot your password?" link |
| `/admin/forgot-password` | Public | Reset link request page |
| `/admin/reset-password` | Public | Password update form (with token query parameter) |
| `/api/admin/login` | Public | Authenticates credentials and issues JWT cookies |
| `/api/admin/forgot-password` | Public | Validates email, rate limits, generates token, sends email |
| `/api/admin/reset-password` | Public | Validates token, hashes password, revokes sessions |

---

## 5. Verification Commands

Run the full verification test suite:

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Jest Unit Tests
npx jest

# Next.js Production Build
npm run build
```
