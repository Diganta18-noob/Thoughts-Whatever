import { AdminRole } from "@prisma/client";

export type Resource =
  | "content"
  | "analytics"
  | "media"
  | "seo"
  | "system"
  | "users"
  | "security"
  | "settings"
  | "export"
  | "notifications"
  | "activity"
  | "jobs"
  | "websites"
  | "seo_strategy"
  | "keywords"
  | "backlinks"
  | "competitors"
  | "outreach"
  | "campaigns"
  | "content_briefs"
  | "audits"
  | "tasks"
  | "reports";

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "export"
  | "manage"
  | "scan";

export type PermissionCheck = {
  resource: Resource;
  action: Action;
};

export const ROLE_LABELS: Record<AdminRole, { labelBn: string; labelEn: string; description: string }> = {
  SUPER_ADMIN: {
    labelBn: "প্রধান প্রশাসক",
    labelEn: "Super Admin",
    description: "Full unrestricted access across all systems, users, security, and infrastructure.",
  },
  ADMIN: {
    labelBn: "প্রশাসক",
    labelEn: "Admin",
    description: "Management access to websites, content, analytics, campaigns, settings, and team members.",
  },
  SEO_MANAGER: {
    labelBn: "এসইও ম্যানেজার",
    labelEn: "SEO Manager",
    description: "Manage SEO strategy, keyword tracking, backlink opportunities, competitors, and technical audits.",
  },
  CONTENT_WRITER: {
    labelBn: "বিষয়বস্তু লেখক",
    labelEn: "Content Writer",
    description: "Access content strategy, linkable assets, content briefs, articles, and internal linking suggestions.",
  },
  OUTREACH_MANAGER: {
    labelBn: "আউটরিচ ম্যানেজার",
    labelEn: "Outreach Manager",
    description: "Manage backlink prospects, contacts, outreach campaigns, email drafts, and follow-up sequences.",
  },
  EDITOR: {
    labelBn: "সম্পাদক",
    labelEn: "Editor",
    description: "Full editorial control — publish, edit, review, and manage media & SEO.",
  },
  AUTHOR: {
    labelBn: "লেখক",
    labelEn: "Author",
    description: "Create and draft articles and upload media.",
  },
  ANALYST: {
    labelBn: "বিশ্লেষক",
    labelEn: "Analyst",
    description: "Access to analytics dashboards, engagement intelligence, SEO metrics, and data exports.",
  },
  VIEWER: {
    labelBn: "দর্শক",
    labelEn: "Viewer",
    description: "Read-only access to published content, backlinks, and basic metrics.",
  },
};

const ROLE_PERMISSIONS: Record<AdminRole, Array<{ resource: Resource; actions: Action[] }>> = {
  SUPER_ADMIN: [
    { resource: "content", actions: ["create", "read", "update", "delete", "publish", "export", "manage"] },
    { resource: "analytics", actions: ["read", "export", "manage"] },
    { resource: "media", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "seo", actions: ["read", "scan", "manage"] },
    { resource: "system", actions: ["read", "update", "manage"] },
    { resource: "users", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "security", actions: ["read", "update", "manage"] },
    { resource: "settings", actions: ["read", "update", "manage"] },
    { resource: "export", actions: ["create", "read", "export", "manage"] },
    { resource: "notifications", actions: ["read", "update", "delete", "manage"] },
    { resource: "activity", actions: ["read", "export", "manage"] },
    { resource: "jobs", actions: ["read", "update", "manage"] },
    { resource: "websites", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "seo_strategy", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "keywords", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "backlinks", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "competitors", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "outreach", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "campaigns", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "content_briefs", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "audits", actions: ["read", "scan", "manage"] },
    { resource: "tasks", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "reports", actions: ["create", "read", "export", "manage"] },
  ],
  ADMIN: [
    { resource: "content", actions: ["create", "read", "update", "delete", "publish", "export", "manage"] },
    { resource: "analytics", actions: ["read", "export", "manage"] },
    { resource: "media", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "seo", actions: ["read", "scan", "manage"] },
    { resource: "system", actions: ["read", "update"] },
    { resource: "users", actions: ["create", "read", "update"] },
    { resource: "security", actions: ["read"] },
    { resource: "settings", actions: ["read", "update"] },
    { resource: "export", actions: ["create", "read", "export"] },
    { resource: "notifications", actions: ["read", "update", "delete"] },
    { resource: "activity", actions: ["read", "export"] },
    { resource: "jobs", actions: ["read", "update"] },
    { resource: "websites", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "seo_strategy", actions: ["create", "read", "update", "manage"] },
    { resource: "keywords", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "backlinks", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "competitors", actions: ["create", "read", "update", "manage"] },
    { resource: "outreach", actions: ["create", "read", "update", "manage"] },
    { resource: "campaigns", actions: ["create", "read", "update", "manage"] },
    { resource: "content_briefs", actions: ["create", "read", "update", "manage"] },
    { resource: "audits", actions: ["read", "scan", "manage"] },
    { resource: "tasks", actions: ["create", "read", "update", "manage"] },
    { resource: "reports", actions: ["create", "read", "export", "manage"] },
  ],
  SEO_MANAGER: [
    { resource: "websites", actions: ["read", "update"] },
    { resource: "seo", actions: ["read", "scan", "manage"] },
    { resource: "seo_strategy", actions: ["create", "read", "update", "manage"] },
    { resource: "keywords", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "backlinks", actions: ["create", "read", "update", "delete", "manage"] },
    { resource: "competitors", actions: ["create", "read", "update", "manage"] },
    { resource: "audits", actions: ["read", "scan", "manage"] },
    { resource: "tasks", actions: ["create", "read", "update", "manage"] },
    { resource: "reports", actions: ["create", "read", "export"] },
    { resource: "analytics", actions: ["read", "export"] },
    { resource: "content_briefs", actions: ["create", "read", "update"] },
  ],
  CONTENT_WRITER: [
    { resource: "content", actions: ["create", "read", "update"] },
    { resource: "content_briefs", actions: ["create", "read", "update"] },
    { resource: "seo_strategy", actions: ["read"] },
    { resource: "keywords", actions: ["read"] },
    { resource: "tasks", actions: ["read", "update"] },
  ],
  OUTREACH_MANAGER: [
    { resource: "outreach", actions: ["create", "read", "update", "manage"] },
    { resource: "campaigns", actions: ["create", "read", "update", "manage"] },
    { resource: "backlinks", actions: ["read", "update"] },
    { resource: "tasks", actions: ["create", "read", "update"] },
    { resource: "reports", actions: ["read"] },
  ],
  EDITOR: [
    { resource: "content", actions: ["create", "read", "update", "publish", "delete", "export"] },
    { resource: "analytics", actions: ["read", "export"] },
    { resource: "media", actions: ["create", "read", "update", "delete"] },
    { resource: "seo", actions: ["read", "scan"] },
    { resource: "notifications", actions: ["read", "update"] },
    { resource: "activity", actions: ["read"] },
    { resource: "export", actions: ["create", "read"] },
  ],
  AUTHOR: [
    { resource: "content", actions: ["create", "read", "update"] },
    { resource: "media", actions: ["create", "read"] },
    { resource: "notifications", actions: ["read"] },
    { resource: "activity", actions: ["read"] },
  ],
  ANALYST: [
    { resource: "analytics", actions: ["read", "export", "manage"] },
    { resource: "content", actions: ["read"] },
    { resource: "seo", actions: ["read"] },
    { resource: "backlinks", actions: ["read"] },
    { resource: "keywords", actions: ["read"] },
    { resource: "reports", actions: ["create", "read", "export"] },
    { resource: "export", actions: ["create", "read", "export"] },
    { resource: "activity", actions: ["read"] },
    { resource: "notifications", actions: ["read"] },
  ],
  VIEWER: [
    { resource: "content", actions: ["read"] },
    { resource: "analytics", actions: ["read"] },
    { resource: "seo", actions: ["read"] },
    { resource: "backlinks", actions: ["read"] },
    { resource: "keywords", actions: ["read"] },
    { resource: "reports", actions: ["read"] },
    { resource: "activity", actions: ["read"] },
    { resource: "notifications", actions: ["read"] },
  ],
};

export function hasPermission(
  role: AdminRole | string | undefined | null,
  resource: Resource,
  action: Action,
): boolean {
  if (!role) return false;
  const adminRole = role as AdminRole;

  if (adminRole === "SUPER_ADMIN") return true;

  const permissions = ROLE_PERMISSIONS[adminRole];
  if (!permissions) return false;

  const entry = permissions.find((p) => p.resource === resource);
  if (!entry) return false;

  return entry.actions.includes(action) || entry.actions.includes("manage");
}

export function getPermissionsMatrix(): Array<{
  resource: Resource;
  action: Action;
  roles: Record<AdminRole, boolean>;
}> {
  const allRoles: AdminRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "SEO_MANAGER",
    "CONTENT_WRITER",
    "OUTREACH_MANAGER",
    "EDITOR",
    "AUTHOR",
    "ANALYST",
    "VIEWER",
  ];
  const matrix: Array<{ resource: Resource; action: Action; roles: Record<AdminRole, boolean> }> = [];

  const checkList: Array<{ resource: Resource; action: Action }> = [
    { resource: "websites", action: "manage" },
    { resource: "seo_strategy", action: "manage" },
    { resource: "keywords", action: "manage" },
    { resource: "backlinks", action: "manage" },
    { resource: "competitors", action: "manage" },
    { resource: "outreach", action: "manage" },
    { resource: "campaigns", action: "manage" },
    { resource: "content_briefs", action: "manage" },
    { resource: "audits", action: "scan" },
    { resource: "tasks", action: "manage" },
    { resource: "reports", action: "export" },
    { resource: "content", action: "publish" },
    { resource: "users", action: "manage" },
    { resource: "security", action: "manage" },
  ];

  for (const item of checkList) {
    const roleMap: any = {};
    for (const r of allRoles) {
      roleMap[r] = hasPermission(r, item.resource, item.action);
    }
    matrix.push({
      resource: item.resource,
      action: item.action,
      roles: roleMap,
    });
  }

  return matrix;
}

