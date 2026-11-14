# Nightly publishing and maintenance

The authenticated `/api/cron/publish` endpoint is available for testing. The existing Vercel schedule remains active until cutover. At cutover, replace both automation schedule entries with one entry for `/api/cron/publish` in the 1 AM IST window. Set `CRON_SECRET` in Vercel. Publishing keeps its existing conditional database update and cache invalidation.

Run `npx tsx scripts/run-nightly-maintenance.ts` from a full checkout on a separate worker, scheduled in the same 1 AM IST window. Set `NIGHTLY_MAINTENANCE_ENABLED=true` only on that worker. Supply its database, storage, and mail configuration there. Verify access to the directories and remote bucket the backup engine is expected to cover. First use a disposable database, an isolated backup bucket, and test mail settings. Run a backup and restore test and inspect coverage before enabling production.

The worker claims the IST date through an existing unique AuditLog ID. Concurrent starts skip the held claim. Same-day retries can take a FAILED claim. A crash can leave RUNNING in place. Before manually changing a stale RUNNING claim to FAILED, confirm the worker has stopped and check for partial side effects. Automatic claim expiry is intentionally absent so a slow backup cannot overlap with a replacement. Configure job failure alerts and check the individual backup artifacts.

Before promoting the Vercel change, manually exercise the preview publisher with a disposable database and authenticate both requests. Verify one due article is published on the first request and zero on the second. Coordinate the first production worker execution with the retirement of the old Vercel automation schedule so the two paths do not run maintenance for the same night.
