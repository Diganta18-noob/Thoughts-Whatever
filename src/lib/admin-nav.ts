/**
 * The admin portal's route map — one source of truth for the sidebar rail, the
 * ⌘K palette, and the server-side search route.
 *
 * This list previously existed in three copies: `NAV_GROUPS` in
 * `admin-sidebar.tsx`, `adminActions` in `/api/admin/search/route.ts`, and a
 * hardcoded quick-action array inside `command-palette.tsx`. They drifted, the
 * way triplicated lists do — the search copy never gained Reference Library or
 * the SEO Growth Engine, so ⌘K could not reach two of the portal's larger
 * sections at all. Adding a page here now wires it into all three.
 *
 * `icon` is a name, not a component, so this module imports nothing. The search
 * route consumes it server-side and has no use for forty icon components; only
 * the sidebar resolves names to `lucide-react` elements.
 */

export type AdminNavIconName =
  | "activity"
  | "alert-triangle"
  | "bar-chart-2"
  | "bell"
  | "book-open"
  | "book-open-check"
  | "clipboard-list"
  | "clock"
  | "code"
  | "compass"
  | "cpu"
  | "database"
  | "download"
  | "file-text"
  | "folder-tree"
  | "globe"
  | "heart-pulse"
  | "image"
  | "languages"
  | "layout-dashboard"
  | "lightbulb"
  | "list-checks"
  | "mail"
  | "network"
  | "plus-circle"
  | "search-check"
  | "settings"
  | "share-2"
  | "shield-check"
  | "sparkles"
  | "tags"
  | "target"
  | "unlink"
  | "upload-cloud"
  | "users";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIconName;
  /**
   * Extra terms the palette should match on. Labels alone miss how people
   * actually type: "cron" for Scheduled Jobs, "geo" for Audience Geography,
   * "backup" for Settings.
   */
  keywords?: string[];
  badge?: string;
  /**
   * Reachable from ⌘K but not rendered in the rail — deep sub-pages and create
   * forms that would pad an already long list without helping anyone scan it.
   */
  hidden?: boolean;
};

export type AdminNavGroup = {
  name: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    name: "Content",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: "layout-dashboard",
        keywords: ["home", "dashboard", "start"],
      },
      {
        href: "/admin/pieces",
        label: "Pieces",
        icon: "file-text",
        keywords: ["articles", "posts", "rachana", "blog", "drafts"],
      },
      {
        href: "/admin/pieces/new",
        label: "New Piece",
        icon: "plus-circle",
        keywords: ["create", "write", "draft", "compose", "add article"],
        hidden: true,
      },
      {
        href: "/admin/series",
        label: "Series",
        icon: "folder-tree",
        keywords: ["collections", "dharabahik"],
      },
      {
        href: "/admin/reference",
        label: "Reference Library",
        icon: "book-open",
        keywords: ["books", "archive", "reader", "puran", "scans", "rights"],
      },
      {
        href: "/admin/taxonomy",
        label: "Taxonomy",
        icon: "tags",
        keywords: ["tags", "authors", "themes", "eras", "categories"],
      },
      {
        href: "/admin/media",
        label: "Media Library",
        icon: "image",
        keywords: ["images", "covers", "uploads", "cloudinary", "assets"],
      },
      {
        href: "/admin/import",
        label: "Import",
        icon: "upload-cloud",
        keywords: ["migration", "bulk", "ingest", "csv"],
      },
    ],
  },
  {
    name: "Intelligence",
    items: [
      {
        href: "/admin/seo-engine",
        label: "SEO Growth Engine",
        icon: "search-check",
        badge: "PRO",
        keywords: ["search", "ranking", "keywords", "growth"],
      },
      {
        href: "/admin/seo-engine/websites",
        label: "SEO — Tracked Websites",
        icon: "network",
        keywords: ["domains", "properties", "sites"],
        hidden: true,
      },
      {
        href: "/admin/seo-engine/audit",
        label: "SEO — Site Audit",
        icon: "list-checks",
        keywords: ["crawl", "technical", "issues"],
        hidden: true,
      },
      {
        href: "/admin/editorial-intelligence",
        label: "Editorial Intelligence",
        icon: "compass",
        badge: "AI",
        keywords: ["insights", "suggestions", "ai", "gaps"],
      },
      {
        href: "/admin/content-graph",
        label: "Content Graph",
        icon: "share-2",
        keywords: ["links", "relationships", "network", "graphify"],
      },
      {
        href: "/admin/recommendations",
        label: "Recommendations",
        icon: "sparkles",
        keywords: ["related", "suggestions", "discovery"],
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: "bar-chart-2",
        keywords: ["traffic", "views", "stats", "posthog", "trends"],
      },
      {
        href: "/admin/engagement",
        label: "Reading & Engagement",
        icon: "book-open-check",
        keywords: ["retention", "scroll depth", "time on page", "readers"],
      },
      {
        href: "/admin/geography",
        label: "Audience Geography",
        icon: "globe",
        keywords: ["geo", "countries", "regions", "map", "location"],
      },
      {
        href: "/admin/content-health",
        label: "Content Health",
        icon: "heart-pulse",
        keywords: ["quality", "stale", "missing", "audit"],
      },
      {
        href: "/admin/seo",
        label: "SEO Scanner",
        icon: "unlink",
        keywords: ["broken links", "404", "meta", "sitemap", "crawl"],
      },
    ],
  },
  {
    name: "Workflow",
    items: [
      {
        href: "/admin/jobs",
        label: "Scheduled Jobs",
        icon: "clock",
        keywords: ["cron", "automation", "tasks", "queue", "schedule"],
      },
      {
        href: "/admin/activity",
        label: "Activity Feed",
        icon: "activity",
        keywords: ["live", "realtime", "events", "log"],
      },
      {
        href: "/admin/goals",
        label: "Editorial Goals",
        icon: "target",
        keywords: ["kpi", "targets", "objectives", "quota"],
      },
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: "bell",
        keywords: ["alerts", "inbox", "messages"],
      },
      {
        href: "/admin/prompts",
        label: "Prompts & Ideas",
        icon: "lightbulb",
        keywords: ["history", "backlog", "ideas", "notes"],
      },
    ],
  },
  {
    name: "System & Ops",
    items: [
      {
        href: "/admin/system",
        label: "Automation Hub",
        icon: "database",
        keywords: ["maintenance", "cache", "cleanup", "pipeline"],
      },
      {
        href: "/admin/system/monitoring",
        label: "Advanced Monitoring",
        icon: "cpu",
        keywords: ["uptime", "health", "metrics", "performance", "disk"],
      },
      {
        href: "/admin/incidents",
        label: "Incident Center",
        icon: "alert-triangle",
        keywords: ["outage", "errors", "alerts", "postmortem"],
      },
      {
        href: "/admin/security",
        label: "Security Center",
        icon: "shield-check",
        keywords: ["sessions", "logins", "lockout", "2fa", "threats"],
      },
      {
        href: "/admin/audit-log",
        label: "Audit Log",
        icon: "clipboard-list",
        keywords: ["history", "who changed", "trail", "compliance"],
      },
    ],
  },
  {
    name: "Administration",
    items: [
      {
        href: "/admin/team",
        label: "Team & Roles",
        icon: "users",
        keywords: ["members", "permissions", "editors", "access", "invite"],
      },
      {
        href: "/admin/developer",
        label: "API & Webhooks",
        icon: "code",
        keywords: ["tokens", "keys", "integrations", "docs"],
      },
      {
        href: "/admin/exports",
        label: "Data Export Center",
        icon: "download",
        keywords: ["download", "backup", "csv", "json", "archive"],
      },
      {
        href: "/admin/subscribers",
        label: "Subscribers",
        icon: "mail",
        keywords: ["newsletter", "email", "list", "audience"],
      },
      {
        href: "/admin/transliteration",
        label: "Transliteration",
        icon: "languages",
        keywords: ["bengali", "bangla", "romanise", "slug", "script"],
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: "settings",
        keywords: ["config", "backup", "preferences", "site"],
      },
    ],
  },
];

export type AdminNavSearchItem = AdminNavItem & { group: string };

/** Every route, flattened, each tagged with the group it belongs to. */
export const ADMIN_NAV_ITEMS: AdminNavSearchItem[] = ADMIN_NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.name }))
);

/**
 * The one route whose nav entry should read as active for `pathname`.
 *
 * Plain prefix matching cannot do this. `/admin/system/monitoring` starts with
 * `/admin/system`, so Automation Hub and Advanced Monitoring both lit up at
 * once; `/admin/pieces/new` lit up Pieces as well; and `/admin` is a prefix of
 * literally every admin route. Longest match wins instead, which resolves all
 * three without per-item `exact` flags — the deepest registered route that still
 * contains you is the page you are on.
 *
 * Pass `visibleOnly` for the sidebar. Hidden routes are real destinations but
 * have no row to highlight, so on `/admin/pieces/new` the rail wants the nearest
 * ancestor it actually renders — Pieces — rather than nothing at all.
 */
export function resolveActiveHref(
  pathname: string,
  { visibleOnly = false }: { visibleOnly?: boolean } = {}
): string | null {
  let best: string | null = null;

  for (const item of ADMIN_NAV_ITEMS) {
    if (visibleOnly && item.hidden) continue;
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) continue;
    if (best === null || item.href.length > best.length) best = item.href;
  }

  return best;
}

/** The group holding `activeHref`, so the rail can reveal where you are. */
export function resolveActiveGroup(activeHref: string | null): string | null {
  if (!activeHref) return null;
  return ADMIN_NAV_ITEMS.find((item) => item.href === activeHref)?.group ?? null;
}

/**
 * Shown in the palette before anything is typed. Deliberately short: a landing
 * list is a shortcut, not a second copy of the sidebar. Everything else is one
 * fuzzy keystroke away.
 */
export const ADMIN_QUICK_ACTION_HREFS = [
  "/admin/pieces/new",
  "/admin/pieces",
  "/admin/reference",
  "/admin/analytics",
  "/admin/activity",
  "/admin/notifications",
  "/admin/settings",
] as const;

export const ADMIN_QUICK_ACTIONS: AdminNavSearchItem[] = ADMIN_QUICK_ACTION_HREFS.map(
  (href) => ADMIN_NAV_ITEMS.find((item) => item.href === href)
).filter((item): item is AdminNavSearchItem => item !== undefined);
