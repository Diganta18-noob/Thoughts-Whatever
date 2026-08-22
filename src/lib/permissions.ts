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
  | "jobs";

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
    description: "Management access to content, analytics, settings, and team members.",
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
    description: "Access to analytics dashboards, engagement intelligence, and data exports.",
  },
  VIEWER: {
    labelBn: "দর্শক",
    labelEn: "Viewer",
    description: "Read-only access to published content and basic metrics.",
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
    { resource: "export", actions: ["create", "read", "export"] },
    { resource: "activity", actions: ["read"] },
    { resource: "notifications", actions: ["read"] },
  ],
  VIEWER: [
    { resource: "content", actions: ["read"] },
    { resource: "analytics", actions: ["read"] },
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
  const allRoles: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "ANALYST", "VIEWER"];
  const matrix: Array<{ resource: Resource; action: Action; roles: Record<AdminRole, boolean> }> = [];

  const checkList: Array<{ resource: Resource; action: Action }> = [
    { resource: "content", action: "create" },
    { resource: "content", action: "update" },
    { resource: "content", action: "publish" },
    { resource: "content", action: "delete" },
    { resource: "media", action: "create" },
    { resource: "media", action: "delete" },
    { resource: "analytics", action: "read" },
    { resource: "analytics", action: "export" },
    { resource: "seo", action: "scan" },
    { resource: "users", action: "create" },
    { resource: "users", action: "manage" },
    { resource: "security", action: "manage" },
    { resource: "system", action: "manage" },
    { resource: "jobs", action: "manage" },
    { resource: "settings", action: "update" },
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
