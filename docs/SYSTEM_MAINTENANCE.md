# System Maintenance & Optimization Architecture

The automated Server Maintenance System ensures performance optimization, resource management, and overall system health for the *Thoughts Whatever* platform.

## Maintenance Schedule & Workflow
The maintenance system is orchestrated via `src/lib/system/maintenance/orchestrator.ts` and runs automatically at **3:00 AM IST** daily (prior to the 3:30 AM Backup phase).

### Task Sequence & Priorities

1. **Database Optimization (`database.ts`)**
   - Runs `ANALYZE` to update query planner statistics.
   - Runs non-locking `VACUUM` to clean dead tuples.
   - Collects live/dead tuple counts, total size, and table bloat ratios.

2. **Session & Token Cleanup (`session.ts`)**
   - Deletes revoked or expired `RefreshToken` entries older than 7 days.
   - Cleans up `AnalyticsEvent` rows older than the retention threshold (default 90 days).

3. **Log Management (`logs.ts`)**
   - Rotates active `.log` files in `/logs/`.
   - Gzips rotated logs into `/logs/archive/`.
   - Deletes archived logs older than retention limit (default 90 days).

4. **Temp Files Cleanup (`temp.ts`)**
   - Removes orphaned temporary files older than 24 hours from `/tmp` and `/public/uploads/tmp`.

5. **Disk Space Monitor (`disk.ts`) — *Halt Guard***
   - Checks partition disk usage via `check-disk-space`.
   - **Critical Threshold:** Halts system execution if available disk space is less than **20%**.

6. **Security Audits (`security.ts`)**
   - Audits npm dependency vulnerabilities.
   - Verifies admin account presence and integrity.

7. **Performance Analysis (`performance.ts`)**
   - Tracks Node.js heap usage, RSS memory, CPU core utilization, and database active connection count.

8. **Cache Management (`cache.ts`)**
   - Cleans up stale fetch cache files older than 7 days.

---

## Manual Execution
Run maintenance on-demand via the CLI or Admin UI:
```bash
# Via API / Admin Dashboard:
Nav -> System -> "Run Maintenance"
```
