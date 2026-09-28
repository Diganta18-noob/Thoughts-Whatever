# Reference activity

Reference catalogue visits, searches, work opens, reading starts, and listening starts use the existing anonymous `AnalyticsEvent` table. Work events store `metadata.referenceWorkId`. The collector accepts only the five named event types and requires a work ID for work activity. No schema migration or extra tracking service is needed.

The admin overview, analytics page, and Reference Library now show activity for 7, 30, 90 days or all time. “Unique sessions” counts browser sessions across Reference events; it is not a people count. “Work opens” counts detail page openings. Reading and listening counts are opening events, not completion or listening duration. Historical Reference activity was not recorded, so these panels begin at zero and fill after deployment.

The dashboard replaces fixed editorial claims with these measured counts. Article “repeat page views” is views beyond distinct sessions, while “estimated article length” comes from published text. Reader scroll tracking now sends 25, 50, 75, and 100 percent milestones; older visits lack the 25 and 75 percent signals.

Visual direction was reviewed against Vengeance UI, Skiper UI, Animmaster Lib, and SceneAI. The implementation uses the portal's existing counter, card, and reduced-motion primitives to keep the admin bundle small and avoid paid assets.
