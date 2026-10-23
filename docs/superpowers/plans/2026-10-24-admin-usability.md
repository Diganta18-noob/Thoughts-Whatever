# Admin usability implementation plan

Goal: reduce idle admin requests, recover unsaved writing, and make the overview focus on daily work.

Use existing Next.js/React components and design tokens. Work in the current checkout, preserving unrelated pending edits. No database changes or deployment.

1. Test and implement a shared visibility-aware polling hook: no hidden/offline requests, no overlapping ticks, slower intervals, cleanup on unmount. Keep manual refresh and opt-in controls.
2. Test and implement per-account, per-piece browser draft recovery. Explicit restore/discard, storage error feedback, flush on exit, retain on failed saves, clear after successful unchanged save. Never publish automatically.
3. Simplify overview to recent edits and useful links. Remove eager analytics server work; expand optional analytics widgets on demand, preserving layout preferences.
4. Document behavior and run focused tests, full Jest suite, typecheck, and lint. Review the complete diff.

Accepted scope: user's approval of the proposed first batch. Implementation choices above are agent decisions within that scope.

## Result

- [x] Polling hook and call sites implemented; visibility, offline, overlap, and opt-out checks pass.
- [x] Recovery integrated with account-scoped storage, editor warnings, and manual-save cleanup. Review regressions for keyboard save and kind switching fixed.
- [x] Overview shows daily work and recent edits; detailed report widgets mount on demand. Layout defaults shared with the API.
- [x] Independent review completed; production build, typecheck, lint, and all 298 tests passed. Existing rate-limit interval prevents diagnostic Jest shutdown; documented separately.

Ruling: multiple tabs share a recovery slot; concurrent editing is outside this batch and documented. No data model or hosting changes were required.
