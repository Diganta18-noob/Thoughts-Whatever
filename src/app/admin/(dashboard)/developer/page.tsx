"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  RefreshCw,
  X,
  ShieldCheck,
  AlertTriangle,
  Code,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface APIKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revoked: boolean;
  createdAt: string;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  deliveries?: Array<{
    id: string;
    event: string;
    statusCode?: number | null;
    status: string;
    durationMs?: number | null;
    createdAt: string;
  }>;
}

export default function DeveloperAPICenterPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks">("keys");
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Key Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["content.read"]);
  const [keyExpiresDays, setKeyExpiresDays] = useState("90");
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<string | null>(null);

  // New Webhook Modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["article.published"]);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch("/api/admin/developer/keys"),
        fetch("/api/admin/developer/webhooks"),
      ]);
      const keysJson = await keysRes.json();
      const webhooksJson = await webhooksRes.json();
      if (keysJson.ok) setKeys(keysJson.keys);
      if (webhooksJson.ok) setWebhooks(webhooksJson.webhooks);
    } catch {
      toast.error("Failed to load developer resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName,
          scopes: keyScopes,
          expiresInDays: Number(keyExpiresDays),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setNewlyGeneratedSecret(json.secretKey);
        fetchData();
      } else {
        toast.error(json.error || "Failed to create API key");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Applications using it will immediately lose access.")) return;
    try {
      const res = await fetch(`/api/admin/developer/keys?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("API key revoked");
        fetchData();
      }
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: webhookName,
          url: webhookUrl,
          events: webhookEvents,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Webhook endpoint registered");
        setShowWebhookModal(false);
        setWebhookName("");
        setWebhookUrl("");
        fetchData();
      } else {
        toast.error(json.error || "Failed to register webhook");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    toast.loading("Dispatching test ping to endpoint...", { id: "wh-test" });
    try {
      const res = await fetch("/api/admin/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", webhookId }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Ping returned HTTP ${json.delivery.statusCode} (${json.delivery.durationMs}ms)`, { id: "wh-test" });
      } else {
        toast.error(`Ping failed (HTTP ${json.delivery?.statusCode || 500})`, { id: "wh-test" });
      }
      fetchData();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: "wh-test" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="label block mb-1 font-mono uppercase tracking-widest text-[11px] text-content-faint">
            Integrations & Endpoints
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-content">
            API & Webhook Center
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Manage developer programmatic API keys, subscribe external services to editorial events, and inspect HMAC payloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "keys" ? (
            <button
              onClick={() => {
                setNewlyGeneratedSecret(null);
                setShowKeyModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-surface transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Generate API Key
            </button>
          ) : (
            <button
              onClick={() => setShowWebhookModal(true)}
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-surface transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Register Webhook
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-rule gap-8 font-sans text-xs">
        <button
          onClick={() => setActiveTab("keys")}
          className={cn(
            "pb-3 flex items-center gap-2 font-medium transition border-b-2",
            activeTab === "keys"
              ? "border-accent text-content"
              : "border-transparent text-content-soft hover:text-content"
          )}
        >
          <Key className="h-4 w-4" />
          API Keys ({keys.length})
        </button>

        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn(
            "pb-3 flex items-center gap-2 font-medium transition border-b-2",
            activeTab === "webhooks"
              ? "border-accent text-content"
              : "border-transparent text-content-soft hover:text-content"
          )}
        >
          <Webhook className="h-4 w-4" />
          Webhooks ({webhooks.length})
        </button>
      </div>

      {/* Tab: API Keys */}
      {activeTab === "keys" && (
        <div className="border border-rule bg-surface">
          {keys.length === 0 ? (
            <div className="py-20 text-center font-sans text-xs text-content-soft">
              No API keys generated yet. Create one to enable external programmatic access.
            </div>
          ) : (
            <div className="divide-y divide-rule">
              {keys.map((k) => (
                <div key={k.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif text-base font-bold text-content">
                        {k.name}
                      </h3>
                      <code className="font-mono text-xs text-content-soft bg-surface-raised px-2 py-0.5 rounded">
                        {k.keyPrefix}••••••••
                      </code>
                      <span className={cn(
                        "font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-xs font-bold",
                        k.revoked
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {k.revoked ? "REVOKED" : "ACTIVE"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {k.scopes.map((s) => (
                        <span key={s} className="font-mono text-[10px] bg-surface-raised border border-rule px-1.5 py-0.5 rounded text-content-faint">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="font-mono text-[11px] text-content-faint pt-1">
                      Created: {new Date(k.createdAt).toLocaleDateString()}
                      {k.expiresAt && ` • Expires: ${new Date(k.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!k.revoked && (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="rounded-sm border border-rule px-3 py-1.5 font-sans text-xs text-red-600 dark:text-red-400 hover:border-red-600"
                      >
                        Revoke Key
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeTab === "webhooks" && (
        <div className="border border-rule bg-surface">
          {webhooks.length === 0 ? (
            <div className="py-20 text-center font-sans text-xs text-content-soft">
              No webhook endpoints registered.
            </div>
          ) : (
            <div className="divide-y divide-rule">
              {webhooks.map((wh) => (
                <div key={wh.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif text-base font-bold text-content">
                        {wh.name}
                      </h3>
                      <span className="font-mono text-[10px] uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-xs font-bold">
                        ACTIVE
                      </span>
                    </div>

                    <div className="font-mono text-xs text-accent truncate">
                      {wh.url}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {wh.events.map((e) => (
                        <span key={e} className="font-mono text-[10px] bg-surface-raised border border-rule px-1.5 py-0.5 rounded text-content-soft">
                          {e}
                        </span>
                      ))}
                    </div>

                    {wh.deliveries && wh.deliveries.length > 0 && (
                      <div className="font-mono text-[11px] text-content-faint pt-1">
                        Last ping: {wh.deliveries[0].status} (HTTP {wh.deliveries[0].statusCode}, {wh.deliveries[0].durationMs}ms)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTestWebhook(wh.id)}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs text-content-soft hover:border-content-soft hover:text-content"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Test Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md border border-rule bg-surface shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-base font-bold text-content">
                Generate New API Key
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-content-soft hover:text-content">
                <X className="h-5 w-5" />
              </button>
            </div>

            {newlyGeneratedSecret ? (
              <div className="space-y-4">
                <div className="border-l-2 border-accent pl-3 text-xs font-sans text-accent">
                  Make sure to copy your API secret now. You won&apos;t be able to see it again!
                </div>

                <div className="bg-surface-raised border border-rule p-3 rounded-sm font-mono text-xs break-all flex items-center justify-between gap-2">
                  <span>{newlyGeneratedSecret}</span>
                  <button
                    onClick={() => handleCopy(newlyGeneratedSecret, "API Key")}
                    className="p-1 text-content-soft hover:text-content shrink-0"
                  >
                    {copiedText === newlyGeneratedSecret ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="text-right pt-2">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="label block mb-1">Key Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Analytics Exporter Script"
                    value={keyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="label block mb-1">Scopes</label>
                  <div className="space-y-1.5 text-xs font-mono text-content">
                    {["content.read", "content.write", "analytics.read", "system.manage"].map((scope) => (
                      <label key={scope} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={keyScopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) setKeyScopes([...keyScopes, scope]);
                            else setKeyScopes(keyScopes.filter((s) => s !== scope));
                          }}
                          className="rounded border-rule text-accent focus:ring-accent"
                        />
                        <span>{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label block mb-1">Expiration</label>
                  <select
                    value={keyExpiresDays}
                    onChange={(e) => setKeyExpiresDays(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                  >
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                    <option value="0">Never Expires</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-rule">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="rounded-sm border border-rule px-4 py-1.5 font-sans text-xs text-content hover:border-content-soft"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md border border-rule bg-surface shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-base font-bold text-content">
                Register Webhook Endpoint
              </h3>
              <button onClick={() => setShowWebhookModal(false)} className="text-content-soft hover:text-content">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="label block mb-1">Name / Receiver Service</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Notifications"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="label block mb-1">Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="label block mb-1">Events</label>
                <div className="space-y-1.5 text-xs font-mono text-content">
                  {["article.published", "article.updated", "backup.completed", "system.incident"].map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) setWebhookEvents([...webhookEvents, event]);
                          else setWebhookEvents(webhookEvents.filter((ev) => ev !== event));
                        }}
                        className="rounded border-rule text-accent focus:ring-accent"
                      />
                      <span>{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="rounded-sm border border-rule px-4 py-1.5 font-sans text-xs text-content hover:border-content-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Register Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
