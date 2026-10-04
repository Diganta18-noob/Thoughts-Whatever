# CI and deployment

Pull requests to `main` and pushes to `main` run `CI Verify`: lint, typecheck, disposable PostgreSQL 16, sample content and admin seed, unit tests, production build, and Chromium smoke tests. No production database or API secrets are needed.

Node 22 is selected from `.nvmrc`. Set the Vercel project's Node version to 22.x too. Vercel's Git integration owns preview and production deployments; the workflow no longer deploys a second copy using a token. Production environment variables still need to be valid in Vercel.

In GitHub Settings → Rules → Rulesets, target `main`, require a pull request, require the `CI Verify` status check, block force pushes and deletion, and require branches to be up to date before merging. Use zero required approvals for a solo owner. Enable the ruleset after the first run has registered the check. Keep emergency bypass access limited to the owner.

Work on a feature branch, open a pull request, inspect the Vercel preview, and merge after CI passes. The merge triggers production deployment. CI prevents merging only when the GitHub ruleset is active.

Actions → CI → Run workflow can enable `full_e2e` for the longer browser audit. Superseded runs are cancelled, dependencies are cached, and failure diagnostics are retained for seven days. Fixed test credentials exist only inside the runner.

Local checks: `npm run lint`, `npm run typecheck`, and `npm test -- --ci`. For build and browser checks, use a disposable PostgreSQL database; set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `SEED_ADMIN_PASSWORD`, `TEST_ADMIN_EMAIL`, and `TEST_ADMIN_PASSWORD`. Run `npx prisma db push --skip-generate`, `npm run db:seed`, `npm run build`, and `npx playwright test --project=ci-smoke`. Never seed production for CI.

Production schema changes require reviewed Prisma migrations and a separate release decision; CI's disposable `db push` tests the current schema only.
