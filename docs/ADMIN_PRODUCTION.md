# Admin production behavior

- `npm run build` now runs TypeScript and ESLint checks. Treat build failures as deployment blockers.
- Publishing requires `content/publish`; deleted or unavailable admin accounts cannot inherit a token's role.
- A piece saved as `PUBLISHED` with a future `publishedAt` remains a draft with `reviewStatus=scheduled`. The existing daily automation cron promotes due pieces and revalidates public paths. Scheduling is therefore day-granular; do not promise minute-accurate release until a more frequent authorized worker is configured.
- Set `CRON_SECRET` in the deployment environment. Without it, `/api/cron/automation` rejects requests.
- The jobs screen only executes configured backup and SEO runners. Other seeded job definitions are disabled; unsupported jobs return an error rather than reporting a false success.
- Monitoring returns 503 when the database health check fails and reports degraded status for active incidents or failed jobs.

MFA enrollment and a durable background queue still require dedicated database and login-flow work. Existing audit logs, revisions, preview links, and role definitions are reused.

## Admin usability and request budget (2026-10-24)

- Background polling runs only while the tab is visible and the browser is online. Ticks do not overlap; returning to a tab does not replay missed requests. Initial loads and explicit refreshes still work independently.
- Notifications poll every 2 minutes and refresh when opened. Automation status polls every minute. Audit logs and prompts retain opt-in auto-refresh at 2 minutes, with separate Refresh now buttons. Monitoring defaults to manual refresh, with optional 1-minute polling.
- The overview fetches recent pieces and lightweight counts for unscheduled drafts, scheduled pieces, and failed jobs. Analytics aggregates and reference analytics mount only after the editor opens their widgets. Existing saved widget layouts remain supported; default layouts put recent edits first.
- Piece editing keeps a debounced browser-local recovery copy scoped to the authenticated account and piece. All new-piece types share one new-piece recovery slot per account/browser. Hidden-tab, page-exit, and editor-unmount events flush pending changes where the browser permits; browser crashes can still lose the last debounce window.
- Recovery requires an explicit Restore writing or Discard recovery copy decision. It never saves or publishes to the server automatically. Failed server saves retain the copy; successful saves clear it only if no newer edits exist. Browser storage failures are shown in the editor.
- Reload/close and ordinary editor links warn about unsaved changes. Browser history navigation is not blocked. Recovery stays on the same browser and is not a backup or a cross-device sync mechanism; clearing browser storage removes it. Avoid editing the same piece in multiple tabs, which share a recovery slot.
