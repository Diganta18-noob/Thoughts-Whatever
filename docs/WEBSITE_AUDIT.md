# Website audit findings

Baseline on 2026-11-06 was remote main `3d77029`. GitHub reported a successful Vercel deployment for that commit. The live crawl checked 80 unique sitemap and entry-point URLs. All returned HTTP 200 once the advertised sitemap paths were resolved against the public host. All 80 responses advertised localhost canonicals.

| ID | Priority | Reproduction and impact | First batch |
| --- | --- | --- | --- |
| WEB-001 | P1 | Request the live sitemap or inspect a canonical tag on the archive. Both advertise localhost, so discovery metadata points off the public site. | Force the public origin in production and preserve the loopback override in development. Both localhost and IPv4 loopback cases failed before the change and pass now. |
| WEB-002 | P1 | Open the homepage at 768 CSS px. The header expands to 978 px, moving controls beyond the right edge. | Keep the compact menu through tablet widths and constrain its height on short screens. |
| WEB-003 | P1 | Open the Goddess reader and jump to page 404. The completion view hides the page. | Render the last scan and offer a Finish reading control. Regression covers the last page, completion and return. |
| WEB-004 | P2 | Open the homepage at 320 CSS px. Header and footer contents extend past the usable viewport. | Tighten header gaps, constrain footer columns and stack the newsletter controls below 360 px. |

The local browser confirmed zero document and header overflow at 320, 390, 768, 1024 and 1440 CSS px. At 390 px the Goddess reader rendered page 404, completed on request, and returned to page 1. Live mobile search returned results for a Bengali title. The live Goddess details had a reading action, with no download control or rights warning. Existing CI smoke coverage now includes the 320 and 768 px homepage cases.

The remaining audit covers the rest of the browser journey matrix, media playback, authenticated workflows in a disposable database, and accessibility and performance baselines. This first batch still needs preview and production verification.
