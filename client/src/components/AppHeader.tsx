import { useState } from "react";
import { useLocation } from "wouter";
import { Image as ImageIcon, ShieldCheck, LogOut, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";

export default function AppHeader({ active }: { active: "gerador" | "logos" | "admin" }) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const linkClass = (key: typeof active) =>
    `text-[14px] font-medium transition ${
      active === key ? "text-[#F4F1EA]" : "text-[#9AA1AC] hover:text-[#F4F1EA]"
    }`;

  return (
    <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-6 py-5 lg:px-10">
      <button
        onClick={() => setLocation("/generator")}
        className="flex items-center gap-3"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#E7A15E] font-display text-[15px] font-semibold text-[#0E1116]">
          JT
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-[#F4F1EA]">
          Jornal Trade
        </span>
      </button>

      <nav className="hidden items-center gap-8 md:flex">
        <button onClick={() => setLocation("/generator")} className={linkClass("gerador")}>
          Gerador
        </button>
        <button onClick={() => setLocation("/logos")} className={linkClass("logos")}>
          Gerenciar Logos
        </button>
        {user?.role === "admin" && (
          <button
            onClick={() => setLocation("/generator/admin")}
            className={linkClass("admin")}
          >
            Admin
          </button>
        )}
      </nav>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation("/logos")}
          className="flex items-center gap-2 text-sm font-medium text-[#9AA1AC] transition hover:text-[#F4F1EA] md:hidden"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        {user?.role === "admin" && (
          <button
            onClick={() => setLocation("/generator/admin")}
            className="flex items-center gap-2 text-sm font-medium text-[#9AA1AC] transition hover:text-[#F4F1EA] md:hidden"
            title="Admin"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>
        )}

        {user && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#171C26] py-1.5 pl-3 pr-1.5">
            <span className="max-w-[140px] truncate text-[13px] font-medium text-[#C9CDD4]">
              {user.name || user.email}
            </span>
            <button
              onClick={() => setShowPasswordModal(true)}
              title="Trocar senha"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#7E8590] transition hover:bg-white/10 hover:text-[#F4F1EA]"
            >
              <KeyRound className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={logout}
              title="Sair"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#7E8590] transition hover:bg-white/10 hover:text-[#F4F1EA]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </header>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("A confirmação não bate com a nova senha.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao trocar senha.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao trocar senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-3 rounded-[20px] border border-white/[0.09] bg-[#12161F] p-6 text-left shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-[#7FC9B4]" />
            <h2 className="font-display text-lg font-medium text-[#F4F1EA]">Senha alterada</h2>
            <p className="text-sm text-[#9AA1AC]">Sua senha foi atualizada com sucesso.</p>
            <Button
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-[#E7A15E] font-bold text-[#1A1206] hover:bg-[#F0B679]"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-lg font-medium text-[#F4F1EA]">Trocar senha</h2>

            <input
              type="password"
              placeholder="Senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
            />
            <input
              type="password"
              placeholder="Nova senha (mínimo 6 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
            />
            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
            />

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-100/90">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/10 text-[#F4F1EA] hover:bg-white/15"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !currentPassword || !newPassword}
                className="flex-1 rounded-xl bg-[#E7A15E] font-bold text-[#1A1206] hover:bg-[#F0B679] disabled:opacity-40"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
