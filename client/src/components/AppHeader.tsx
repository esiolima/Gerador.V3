import { useLocation } from "wouter";
import { Image as ImageIcon, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/auth/useAuth";

export default function AppHeader({ active }: { active: "gerador" | "logos" | "admin" }) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

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
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#171C26] py-1.5 pl-3 pr-1.5">
            <span className="max-w-[140px] truncate text-[13px] font-medium text-[#C9CDD4]">
              {user.name || user.email}
            </span>
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
    </header>
  );
}
