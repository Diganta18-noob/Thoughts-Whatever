# Reference Library & Rights-Aware Digital Archive Architecture

## 1. Executive Summary & Core Principle
The **Thoughts.Whatever Reference Library** is an editorial digital archive and research platform dedicated to Bengali literary works, historical documents, manuscripts, research sources, audio references, and full transcriptions.

### The Invariant
- **Verified Rights (Public Domain / Licensed):** Thoughts.Whatever may host digital assets (PDFs, Audio MP3s, Transcripts) and provide in-browser reading/listening.
- **Unverified / Restricted / External (e.g., Internet Archive by default):** Thoughts.Whatever catalogs bibliographic metadata and links directly to the legitimate external repository. **No unauthorized file hosting or downloads are permitted.**
- **Internet Archive $\neq$ Public Domain:** Ingestion from Internet Archive or other open repositories defaults to `RIGHTS_UNVERIFIED` and `EXTERNAL` hosting until edition-specific legal verification is completed and logged.

---

## 2. Data Model Hierarchy
To prevent copyright conflation between historical works and modern annotated editions, the data model separates the intellectual work from specific editions:

```
ReferenceWork (Canonical Literary / Historical Work)
  │
  ├── ReferenceEdition (Specific Historical / Modern Edition or Translation)
  │     │
  │     ├── ReferenceSource (Origin attribution: Internet Archive, National Library, etc.)
  │     ├── ReferenceRights (Current verified rights state, license, authority, evidence)
  │     ├── ReferenceRightsLog[] (Immutable audit log of every rights state modification)
  │     └── ReferenceAsset[] (Hosted files: PDF, EPUB, Audio, Transcript text)
  │
  └── Author (Existing Thoughts.Whatever Author dossier link)
```

### Rights States (`ReferenceRightsStatus`)
1. `PUBLIC_DOMAIN`: Verified free of copyright restrictions under Indian Copyright Act Section 22 (author deceased 60+ years) or applicable international terms.
2. `LICENSED`: Explicit written authorization, institutional permission, or Creative Commons distribution.
3. `EXTERNAL_SOURCE`: Cataloged reference; points directly to institutional origin; no files hosted.
4. `RIGHTS_UNVERIFIED`: Rights state not yet proven; strictly external link-only; download/reader blocked.
5. `RESTRICTED`: Active copyright; bibliographic metadata and citation only.

---

## 3. Server Guardrails & Invariants
- **`validateHostingRights(hostingMode, rightsStatus)`**:
  Throws an unprocessable entity error if `hostingMode === "THOUGHTS_WHATEVER"` and `rightsStatus` is not `PUBLIC_DOMAIN` or `LICENSED`.
- **Automatic Downgrade**:
  If an edition's rights state is transitioned to `RIGHTS_UNVERIFIED`, `EXTERNAL_SOURCE`, or `RESTRICTED`, the system automatically changes `hostingMode` to `EXTERNAL` to prevent accidental file exposure.
- **Immutable Rights Audit Trail**:
  Every rights review transition creates an immutable record in `ReferenceRightsLog` tracking `previousStatus`, `newStatus`, `changedBy`, `reason`, `notes`, `evidenceUrl`, and timestamp.

---

## 4. Endpoints & Routes

### Public Endpoints
- `/reference`: Archive landing page with live dynamic statistics, category selector, faceted search, and exhibits.
- `/reference/[slug]`: Resource dossier with bibliographic details, dynamic action buttons, rights badge, and original source attribution.
- `/reference/[slug]/read`: Online reader for verified hosted works (zoom, font scaling, dark/sepia/paper themes).
- `/reference/rights`: Archive copyright and rights policy documentation.
- `GET /api/reference`: Filtered and paginated search catalog with live count metrics.
- `GET /api/reference/[slug]`: Public dossier data.
- `POST /api/reference/takedown`: Community rights inquiry and takedown notice submission.

### Admin Endpoints
- `/admin/reference`: Admin Management Hub with rights overview KPIs, status filter tabs, search, and action modals.
- `GET /api/admin/reference`: Admin resource list with rights breakdown metrics.
- `POST /api/admin/reference`: Create work + edition + source with rights guardrail verification.
- `PATCH /api/admin/reference/[id]`: Update resource metadata.
- `DELETE /api/admin/reference/[id]`: Delete resource.
- `POST /api/admin/reference/[id]/rights-review`: Transition rights state with immutable audit trail.
- `POST /api/admin/reference/[id]/assets`: Attach digital asset verifying hosting rights.
- `GET/PATCH /api/admin/reference/claims`: Moderate community copyright notices.
