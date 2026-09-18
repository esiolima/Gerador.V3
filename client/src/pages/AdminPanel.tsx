import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  active: boolean;
  status: "pending" | "approved";
  company?: string;
  jobTitle?: string;
  phone?: string;
  message?: string;
  createdAt: string;
};

function generatePassword() {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, "user" | "admin">>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastPassword, setLastPassword] = useState<{ id: string; password: string } | null>(null);

  const loadUsers = async () => {
    setError(null);
    try {
      const response = await fetch("/api/admin/users", { credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao carregar usuários.");
      }

      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (id: string) => {
    const password = generatePassword();
    const role = pendingRoles[id] || "user";
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao aprovar usuário.");
      }

      setLastPassword({ id, password });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar usuário.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleRole = async (id: string, currentRole: "user" | "admin") => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    const verb = nextRole === "admin" ? "Tornar" : "Remover privilégio de";

    if (!window.confirm(`${verb} administrador para este usuário?`)) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}/role`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao alterar papel do usuário.");
      }

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar papel do usuário.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Rejeitar e remover este pedido de acesso?")) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao rejeitar pedido.");
      }

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao rejeitar pedido.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    const password = generatePassword();

    if (!window.confirm("Gerar uma nova senha para este usuário?")) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao resetar senha.");
      }

      setLastPassword({ id, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resetar senha.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir definitivamente "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao excluir usuário.");
      }

      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir usuário.");
    } finally {
      setBusyId(null);
    }
  };

  const pending = users?.filter((u) => u.status === "pending") ?? [];
  const approved = users?.filter((u) => u.status === "approved") ?? [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0E1116] font-sans text-[#F4F1EA]">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 92% 0%, rgba(231,161,94,0.12), transparent 65%), linear-gradient(180deg,#0E1116 0%,#0B0E13 100%)",
        }}
      />

      <AppHeader active="admin" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-10 px-6 py-14">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7A15E]/15 text-[#E7A15E]">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">
              Painel de administração
            </h1>
            <p className="text-sm text-[#9AA1AC]">
              Aprove pedidos de acesso e gerencie os usuários do sistema.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {lastPassword && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#7FC9B4]/25 bg-[#7FC9B4]/10 px-4 py-3 text-sm text-[#D7F0E8]">
            <span>
              Senha gerada: <strong className="font-mono">{lastPassword.password}</strong> — copie e
              envie para o usuário agora, ela não será mostrada de novo.
            </span>
            <button
              onClick={() => setLastPassword(null)}
              className="shrink-0 text-[#D7F0E8]/70 hover:text-[#D7F0E8]"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#7E8590]">
            Pedidos pendentes {users && `(${pending.length})`}
          </h2>

          {users === null ? (
            <p className="text-sm text-[#7E8590]">Carregando...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-[#7E8590]">Nenhum pedido de acesso pendente.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((u) => (
                <div
                  key={u.id}
                  className="rounded-[16px] border border-white/[0.09] bg-[#12161F] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[15px] font-semibold text-[#F4F1EA]">{u.name}</p>
                      <p className="text-[13px] text-[#9AA1AC]">{u.email}</p>
                      {(u.company || u.jobTitle) && (
                        <p className="text-[13px] text-[#7E8590]">
                          {[u.jobTitle, u.company].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {u.phone && <p className="text-[13px] text-[#7E8590]">{u.phone}</p>}
                      {u.message && (
                        <p className="mt-2 max-w-md text-[13px] italic text-[#7E8590]">
                          "{u.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={pendingRoles[u.id] || "user"}
                        onChange={(e) =>
                          setPendingRoles((current) => ({
                            ...current,
                            [u.id]: e.target.value as "user" | "admin",
                          }))
                        }
                        className="h-9 rounded-lg border border-white/10 bg-[#0F131B] px-2 text-[13px] text-[#C9CDD4] outline-none"
                      >
                        <option value="user">Usuário</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        disabled={busyId === u.id}
                        onClick={() => handleApprove(u.id)}
                        className="h-9 rounded-lg bg-[#7FC9B4]/15 px-3 text-[13px] font-semibold text-[#7FC9B4] hover:bg-[#7FC9B4]/25"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Aprovar
                      </Button>
                      <Button
                        disabled={busyId === u.id}
                        onClick={() => handleReject(u.id)}
                        className="h-9 rounded-lg bg-red-500/15 px-3 text-[13px] font-semibold text-red-300 hover:bg-red-500/25"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#7E8590]">
            Usuários aprovados {users && `(${approved.length})`}
          </h2>

          {users !== null && approved.length > 0 && (
            <div className="overflow-hidden rounded-[16px] border border-white/[0.09]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#12161F] text-[12px] uppercase tracking-wide text-[#7E8590]">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Papel</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((u) => (
                    <tr key={u.id} className="border-t border-white/[0.06] bg-[#0F131B]">
                      <td className="px-4 py-3 font-medium text-[#F4F1EA]">{u.name}</td>
                      <td className="px-4 py-3 text-[#9AA1AC]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            u.role === "admin"
                              ? "bg-[#E7A15E]/15 text-[#E7A15E]"
                              : "bg-white/10 text-[#9AA1AC]"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleResetPassword(u.id)}
                            title="Resetar senha"
                            className="text-[#9AA1AC] hover:text-[#E7A15E] disabled:opacity-40"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleToggleRole(u.id, u.role)}
                            title={u.role === "admin" ? "Remover admin" : "Tornar admin"}
                            className="text-[#9AA1AC] hover:text-[#E7A15E] disabled:opacity-40"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleDelete(u.id, u.name)}
                            title="Excluir"
                            className="text-[#9AA1AC] hover:text-red-400 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
