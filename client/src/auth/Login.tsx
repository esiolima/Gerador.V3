import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "./useAuth";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRequest = async () => {
    setRequestError(null);
    setIsSendingRequest(true);

    try {
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao enviar solicitação.");
      }

      setRequestSent(true);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Erro ao enviar solicitação.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0E1116] font-sans text-[#F4F1EA]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 50% 0%, rgba(231,161,94,0.12), transparent 65%), linear-gradient(180deg,#0E1116 0%,#0B0E13 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-[#E7A15E] font-display text-[19px] font-semibold text-[#0E1116]">
            JT
          </div>
          <h1 className="text-center font-display text-3xl font-medium tracking-tight text-[#F4F1EA] md:text-4xl">
            Jornal Trade
          </h1>
        </div>

        <div className="w-full max-w-md rounded-[20px] border border-white/[0.09] bg-[#12161F] p-7 shadow-2xl">
          <h2 className="mb-5 text-[15px] font-semibold text-[#F4F1EA]">Entrar</h2>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
            />
          </div>

          {loginError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-100/90">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {loginError}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isSubmitting || !email || !password}
            className="mt-4 h-11 w-full rounded-xl bg-[#E7A15E] text-sm font-bold text-[#1A1206] hover:bg-[#F0B679] disabled:opacity-40"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setShowRequest(true);
                setRequestSent(false);
                setRequestError(null);
              }}
              className="text-[13px] text-[#E7A15E] hover:underline"
            >
              Solicitar acesso
            </button>
          </div>
        </div>
      </div>

      {showRequest && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowRequest(false)}
        >
          <div
            className="w-full max-w-md space-y-3 rounded-[20px] border border-white/[0.09] bg-[#12161F] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRequest(false)}
              className="text-[13px] text-[#7E8590] hover:text-[#F4F1EA]"
            >
              ← Voltar
            </button>

            {requestSent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-[#7FC9B4]" />
                <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                  Solicitação enviada
                </h2>
                <p className="text-sm text-[#9AA1AC]">
                  Um administrador vai avaliar seu pedido de acesso em breve.
                </p>
                <Button
                  onClick={() => setShowRequest(false)}
                  className="mt-2 rounded-xl bg-white/10 text-sm font-semibold text-[#F4F1EA] hover:bg-white/15"
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                  Solicitar acesso
                </h2>

                {[
                  { key: "name", placeholder: "Nome" },
                  { key: "email", placeholder: "E-mail" },
                  { key: "company", placeholder: "Empresa" },
                  { key: "role", placeholder: "Cargo" },
                  { key: "phone", placeholder: "Telefone" },
                ].map((f) => (
                  <input
                    key={f.key}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ))}

                <textarea
                  placeholder="Mensagem (opcional)"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-[#E7A15E]/50"
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />

                {requestError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-100/90">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {requestError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => setShowRequest(false)}
                    className="flex-1 rounded-xl bg-white/10 text-[#F4F1EA] hover:bg-white/15"
                  >
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleSendRequest}
                    disabled={isSendingRequest || !form.name || !form.email}
                    className="flex-1 rounded-xl bg-[#E7A15E] font-bold text-[#1A1206] hover:bg-[#F0B679] disabled:opacity-40"
                  >
                    {isSendingRequest ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
