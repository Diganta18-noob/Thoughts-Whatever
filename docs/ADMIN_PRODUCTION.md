# Admin production behavior

- `npm run build` now runs TypeScript and ESLint checks. Treat build failures as deployment blockers.
- Publishing requires `content/publish`; deleted or unavailable admin accounts cannot inherit a token's role.
- A piece saved as `PUBLISHED` with a future `publishedAt` remains a draft with `reviewStatus=scheduled`. The existing daily automation cron promotes due pieces and revalidates public paths. Scheduling is therefore day-granular; do not promise minute-accurate release until a more frequent authorized worker is configured.
- Set `CRON_SECRET` in the deployment environment. Without it, `/api/cron/automation` rejects requests.
- The jobs screen only executes configured backup and SEO runners. Other seeded job definitions are disabled; unsupported jobs return an error rather than reporting a false success.
- Monitoring returns 503 when the database health check fails and reports degraded status for active incidents or failed jobs.

MFA enrollment and a durable background queue still require dedicated database and login-flow work. Existing audit logs, revisions, preview links, and role definitions are reused.
