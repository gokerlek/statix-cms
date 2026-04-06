"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldOff, Ban, Trash2, UserPlus, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CMSUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean | null;
  createdAt: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<CMSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await authClient.admin.listUsers({ query: { limit: 100 } });
      setUsers((data?.users ?? []) as CMSUser[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function setRole(userId: string, role: "admin" | "user") {
    setActionLoading(userId + role);
    try {
      await authClient.admin.setRole({ userId, role });
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  async function banUser(userId: string) {
    setActionLoading(userId + "ban");
    try {
      await authClient.admin.banUser({ userId });
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  async function unbanUser(userId: string) {
    setActionLoading(userId + "unban");
    try {
      await authClient.admin.unbanUser({ userId });
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  async function removeUser(userId: string) {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return;
    setActionLoading(userId + "delete");
    try {
      await authClient.admin.removeUser({ userId });
      await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteError("");
    setInviteLoading(true);
    try {
      await authClient.admin.createUser({
        email: inviteEmail,
        name: inviteEmail.split("@")[0],
        password: Math.random().toString(36).slice(-12),
        role: "user",
      });
      setInviteEmail("");
      setDialogOpen(false);
      await fetchUsers();
    } catch {
      setInviteError("Kullanıcı eklenemedi. Email zaten kayıtlı olabilir.");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcılar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            CMS kullanıcılarını yönetin
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Kullanıcı Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="kullanici@sirket.com"
                  required
                  disabled={inviteLoading}
                />
              </div>
              {inviteError && (
                <p className="text-destructive text-sm">{inviteError}</p>
              )}
              <Button type="submit" className="w-full" disabled={inviteLoading || !inviteEmail}>
                {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Ekle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={user.banned ? "opacity-50" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {user.role === "admin" ? "Admin" : "Editor"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs ${user.banned ? "text-destructive" : "text-green-600"}`}>
                    {user.banned ? "Banlı" : "Aktif"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {user.role !== "admin" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRole(user.id, "admin")}
                        disabled={actionLoading === user.id + "admin"}
                        title="Admin yap"
                      >
                        {actionLoading === user.id + "admin" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRole(user.id, "user")}
                        disabled={actionLoading === user.id + "user"}
                        title="Editor yap"
                      >
                        {actionLoading === user.id + "user" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldOff className="w-4 h-4" />
                        )}
                      </Button>
                    )}

                    {user.banned ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => unbanUser(user.id)}
                        disabled={actionLoading === user.id + "unban"}
                        title="Banı kaldır"
                      >
                        {actionLoading === user.id + "unban" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => banUser(user.id)}
                        disabled={actionLoading === user.id + "ban"}
                        title="Banla"
                      >
                        {actionLoading === user.id + "ban" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUser(user.id)}
                      disabled={actionLoading === user.id + "delete"}
                      title="Sil"
                    >
                      {actionLoading === user.id + "delete" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
