"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AuditEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  "media.upload":           { label: "Upload",        variant: "default" },
  "media.soft_delete":      { label: "Soft Delete",   variant: "secondary" },
  "media.restore":          { label: "Restore",       variant: "outline" },
  "media.permanent_delete": { label: "Perm. Delete",  variant: "destructive" },
  "media.move":             { label: "Move",          variant: "secondary" },
  "user.role_change":       { label: "Role Change",   variant: "default" },
  "user.ban":               { label: "Ban",           variant: "destructive" },
  "user.unban":             { label: "Unban",         variant: "outline" },
  "user.delete":            { label: "Delete User",   variant: "destructive" },
  "user.create":            { label: "Create User",   variant: "default" },
  "auth.login":             { label: "Login",         variant: "secondary" },
  "auth.logout":            { label: "Logout",        variant: "outline" },
  "content.restore":        { label: "Restore",       variant: "outline" },
  "content.permanent_delete": { label: "Perm. Delete", variant: "destructive" },
};

function metadataSummary(raw: string | null): string {
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(", ");
  } catch {
    return raw;
  }
}

export function AuditLogTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit?limit=100")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.userEmail ?? "").toLowerCase().includes(q) ||
      (l.entityId ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Ara (aksiyon, kullanıcı, dosya...)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Kayıt bulunamadı.
        </div>
      ) : (
        <div className="border rounded-md divide-y text-sm">
          <div className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr] gap-3 px-4 py-2 bg-muted/50 font-medium text-xs uppercase tracking-wide">
            <div>Zaman</div>
            <div>Kullanıcı</div>
            <div>Aksiyon / Detay</div>
            <div>IP</div>
            <div>Entity</div>
          </div>

          {filtered.map((log) => {
            const badge = ACTION_BADGE[log.action] ?? { label: log.action, variant: "outline" as const };
            return (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_1fr_2fr_1fr_1fr] gap-3 px-4 py-3 items-start hover:bg-muted/30 transition-colors"
              >
                <div className="text-muted-foreground whitespace-nowrap">
                  {log.createdAt
                    ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                    : "—"}
                </div>

                <div className="truncate text-muted-foreground" title={log.userEmail ?? undefined}>
                  {log.userEmail ?? "system"}
                </div>

                <div className="space-y-1">
                  <Badge variant={badge.variant} className="text-xs">
                    {badge.label}
                  </Badge>
                  {log.metadata && (
                    <p className="text-xs text-muted-foreground truncate" title={metadataSummary(log.metadata)}>
                      {metadataSummary(log.metadata)}
                    </p>
                  )}
                </div>

                <div className="text-muted-foreground text-xs truncate">
                  {log.ipAddress ?? "—"}
                </div>

                <div className="text-xs truncate text-muted-foreground" title={log.entityId ?? undefined}>
                  {log.entityId ? log.entityId.split("/").pop() : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
