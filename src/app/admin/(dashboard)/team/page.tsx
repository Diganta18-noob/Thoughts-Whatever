"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Check,
  X,
  Edit2,
  Trash2,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  email: string;
  nameBn?: string | null;
  role: string;
  status: string;
  lastActiveAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  activeSessionsCount: number;
  roleMeta: {
    labelBn: string;
    labelEn: string;
    description: string;
  };
}

interface PermissionMatrixItem {
  resource: string;
  action: string;
  roles: Record<string, boolean>;
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [matrix, setMatrix] = useState<PermissionMatrixItem[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("ADMIN");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "matrix">("members");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<TeamMember | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formNameBn, setFormNameBn] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("EDITOR");
  const [formStatus, setFormStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (data.ok) {
        setMembers(data.members);
        setMatrix(data.permissionsMatrix);
        setCurrentRole(data.currentAdminRole);
      }
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          nameBn: formNameBn,
          role: formRole,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Team member ${data.member.email} created!`);
        setShowAddModal(false);
        setFormEmail("");
        setFormPassword("");
        setFormNameBn("");
        fetchTeam();
      } else {
        toast.error(data.message || "Failed to create team member");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: showEditModal.id,
          role: formRole,
          status: formStatus,
          nameBn: formNameBn,
          password: formPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Team member updated");
        setShowEditModal(null);
        setFormPassword("");
        fetchTeam();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove team member ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Team member removed");
        fetchTeam();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const openEdit = (m: TeamMember) => {
    setShowEditModal(m);
    setFormRole(m.role);
    setFormStatus(m.status);
    setFormNameBn(m.nameBn || "");
    setFormPassword("");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-accent/15 text-accent border-accent/30";
      case "ADMIN":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "EDITOR":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "AUTHOR":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "ANALYST":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-content/5 text-content-soft border-rule";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Team & Role Management
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              {members.length} {members.length === 1 ? "MEMBER" : "MEMBERS"}
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Role-Based Access Control (RBAC), multi-user administration, permissions matrix, and session status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setFormEmail("");
            setFormPassword("");
            setFormNameBn("");
            setFormRole("EDITOR");
          }}
          className="flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-accent/90 transition shadow-sm"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Team Member
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-rule">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2 font-sans text-xs transition",
            activeTab === "members"
              ? "border-accent font-semibold text-accent"
              : "border-transparent text-content-soft hover:text-content"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Team Members
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2 font-sans text-xs transition",
            activeTab === "matrix"
              ? "border-accent font-semibold text-accent"
              : "border-transparent text-content-soft hover:text-content"
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          Permissions Matrix
        </button>
      </div>

      {/* Tab 1: Members Table */}
      {activeTab === "members" && (
        <div className="rounded-sm border border-rule bg-surface-raised overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center font-sans text-xs text-content-faint">
              Loading team directory...
            </div>
          ) : (
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-rule bg-surface/60 font-mono text-[10px] uppercase tracking-wider text-content-faint">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active Sessions</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/70">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-surface/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-content">
                          {m.nameBn || m.email.split("@")[0]}
                        </span>
                        <span className="font-mono text-[11px] text-content-soft">
                          {m.email}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold",
                          getRoleBadgeColor(m.role)
                        )}
                      >
                        {m.roleMeta.labelEn}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider",
                          m.status === "active"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-content-faint"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            m.status === "active" ? "bg-emerald-600 dark:bg-emerald-400" : "bg-content-faint"
                          )}
                        />
                        {m.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-content-soft">
                      {m.activeSessionsCount}{" "}
                      {m.activeSessionsCount === 1 ? "device" : "devices"}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-content-faint">
                      {m.lastActiveAt
                        ? new Date(m.lastActiveAt).toLocaleString()
                        : m.lastLoginAt
                        ? new Date(m.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="rounded-sm p-1 text-content-soft hover:text-accent transition"
                          title="Edit member"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {m.role !== "SUPER_ADMIN" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id, m.email)}
                            className="rounded-sm p-1 text-content-faint hover:text-red-600 transition"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Permissions Matrix */}
      {activeTab === "matrix" && (
        <div className="rounded-sm border border-rule bg-surface-raised overflow-x-auto p-6 space-y-6">
          <div>
            <h2 className="font-serif text-lg font-normal text-content">
              Role Permission Matrix
            </h2>
            <p className="font-sans text-xs text-content-soft mt-1">
              Enforced across Next.js API endpoints and server actions.
            </p>
          </div>

          <table className="w-full text-left font-sans text-xs">
            <thead className="border-b border-rule bg-surface/60 font-mono text-[10px] uppercase tracking-wider text-content-faint">
              <tr>
                <th className="px-4 py-3">Resource & Action</th>
                {["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "ANALYST", "VIEWER"].map((r) => (
                  <th key={r} className="px-3 py-3 text-center">
                    {r.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/70">
              {matrix.map((row) => (
                <tr key={`${row.resource}-${row.action}`} className="hover:bg-surface/30">
                  <td className="px-4 py-2.5 font-medium text-content">
                    <span className="capitalize">{row.action}</span>{" "}
                    <span className="font-mono text-content-soft uppercase text-[10px]">
                      ({row.resource})
                    </span>
                  </td>

                  {["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "ANALYST", "VIEWER"].map((r) => {
                    const granted = row.roles[r];
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {granted ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-rule text-sm select-none">&mdash;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-content/30 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-sm border border-rule bg-surface-raised p-6 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-lg font-normal text-content">
                Add Team Member
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-content-faint hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="mt-4 space-y-4 font-sans text-xs">
              <div>
                <label className="label block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="editor@thoughts-whatever.com"
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="label block mb-1">Bengali / Display Name (Optional)</label>
                <input
                  type="text"
                  value={formNameBn}
                  onChange={(e) => setFormNameBn(e.target.value)}
                  placeholder="যেমন: অনির্বাণ সেন"
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="label block mb-1">Initial Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="label block mb-1">Assigned Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                >
                  <option value="EDITOR">Editor (Full Content & Media Access)</option>
                  <option value="AUTHOR">Author (Draft & Upload Access)</option>
                  <option value="ANALYST">Analyst (Analytics & Export Access)</option>
                  <option value="ADMIN">Admin (Content & User Management)</option>
                  {currentRole === "SUPER_ADMIN" && (
                    <option value="SUPER_ADMIN">Super Admin (Unrestricted)</option>
                  )}
                  <option value="VIEWER">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-sm border border-rule px-3 py-1.5 text-content-soft hover:text-content"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sm bg-accent px-4 py-1.5 text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-content/30 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-sm border border-rule bg-surface-raised p-6 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-lg font-normal text-content">
                Edit Member &bull; {showEditModal.email}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="text-content-faint hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="mt-4 space-y-4 font-sans text-xs">
              <div>
                <label className="label block mb-1">Bengali / Display Name</label>
                <input
                  type="text"
                  value={formNameBn}
                  onChange={(e) => setFormNameBn(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="label block mb-1">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="AUTHOR">Author</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="ADMIN">Admin</option>
                  {currentRole === "SUPER_ADMIN" && (
                    <option value="SUPER_ADMIN">Super Admin</option>
                  )}
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div>
                <label className="label block mb-1">Account Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Access Suspended)</option>
                </select>
              </div>

              <div>
                <label className="label block mb-1">Reset Password (leave blank to keep current)</label>
                <input
                  type="password"
                  placeholder="New password (min 8 chars)"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="rounded-sm border border-rule px-3 py-1.5 text-content-soft hover:text-content"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sm bg-accent px-4 py-1.5 text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
