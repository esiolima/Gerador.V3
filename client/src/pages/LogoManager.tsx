import { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import AppHeader from "@/components/AppHeader";

interface Logo {
  name: string;
  path: string;
  mtime?: number;
}

type SortOption = "name" | "date";

export default function LogoManager() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [replacingLogo, setReplacingLogo] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState<Record<string, number>>({});

  const { data: logosData, refetch } = trpc.logo.listLogos.useQuery();

  useEffect(() => {
    if (logosData?.logos) {
      setLogos(logosData.logos);
    }
  }, [logosData]);

  const sortedLogos = useMemo(() => {
    const filtered = logos.filter((logo) => logo.name !== "blank.png");

    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? filtered.filter((logo) => logo.name.toLowerCase().includes(query))
      : filtered;

    return [...searched].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return (b.mtime || 0) - (a.mtime || 0);
      }
    });
  }, [logos, sortBy, searchQuery]);

  const handleDelete = async (logoName: string) => {
    const confirmDelete = window.confirm(
      `Deseja realmente excluir "${logoName}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/logos/${encodeURIComponent(logoName)}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Erro ao excluir logo");
        return;
      }

      setSuccess(`Logo "${logoName}" excluída com sucesso!`);
      setLogos((current) => current.filter((logo) => logo.name !== logoName));
      refetch();
    } catch {
      setError("Erro ao excluir logo");
    }
  };

  const handleFileSelect = async (file: File | null | undefined, overwrite = false) => {
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setError("Apenas PNG, JPG, JPEG, WEBP e SVG são permitidos");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo não pode exceder 5MB");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("logo", file); // 🔥 IMPORTANTE

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Erro ao enviar logo");
      }

      setSuccess(`Logo "${file.name}" enviada com sucesso!`);
      refetch();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
  };

  const handleReplaceClick = (logoName: string) => {
    setReplaceTarget(logoName);
    replaceInputRef.current?.click();
  };

  const handleReplaceInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetName = replaceTarget;

    // Limpa o input já de cara para permitir escolher o mesmo arquivo de novo depois
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
    }

    if (!file || !targetName) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setError("Apenas PNG, JPG, JPEG, WEBP e SVG são permitidos");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo não pode exceder 5MB");
      return;
    }

    setReplacingLogo(targetName);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch(`/api/logos/${encodeURIComponent(targetName)}/replace`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Erro ao substituir logo");
      }

      setSuccess(`Logo "${targetName}" substituída com sucesso! O nome do arquivo foi mantido.`);
      setCacheBust((current) => ({ ...current, [targetName]: Date.now() }));
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao substituir logo");
    } finally {
      setReplacingLogo(null);
      setReplaceTarget(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0E1116] font-sans text-[#F4F1EA]">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 92% 0%, rgba(231,161,94,0.12), transparent 65%), linear-gradient(180deg,#0E1116 0%,#0B0E13 100%)",
        }}
      />

      <AppHeader active="logos" />

      <main className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 py-14">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Gerenciador de Logos</h1>
          <p className="mt-1.5 text-sm text-[#9AA1AC]">
            Envie novas logos, substitua as existentes ou remova as que não usa mais.
          </p>
        </div>

        {/* Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-[1.5px] border-dashed p-10 text-center transition ${
            isDragging
              ? "border-[#E7A15E] bg-[#E7A15E]/10"
              : "border-[#E7A15E]/35 bg-[#E7A15E]/[0.04] hover:border-[#E7A15E]/60"
          }`}
        >
          <Upload className="mx-auto mb-3 h-9 w-9 text-[#E7A15E]" />
          <p className="text-[15px] font-semibold text-[#F4F1EA]">Arraste ou clique para enviar logo</p>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* Input escondido usado pelo botão de substituir de cada logo */}
        <input
          ref={replaceInputRef}
          type="file"
          onChange={handleReplaceInputChange}
          className="hidden"
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-[#7FC9B4]/25 bg-[#7FC9B4]/10 px-4 py-3 text-sm text-[#D7F0E8]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7E8590]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar logo pelo nome..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm outline-none placeholder:text-[#7E8590] focus:border-[#E7A15E]/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8590] hover:text-[#F4F1EA]"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <p className="text-xs text-[#7E8590]">
            {sortedLogos.length}{" "}
            {sortedLogos.length === 1 ? "logo encontrada" : "logos encontradas"} para "{searchQuery}"
          </p>
        )}

        {/* Logos */}
        {searchQuery && sortedLogos.length === 0 ? (
          <div className="py-10 text-center text-[#7E8590]">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-40" />
            Nenhuma logo encontrada para "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {sortedLogos.map((logo) => (
              <div
                key={logo.name}
                className="relative rounded-[14px] border border-white/[0.08] bg-[#12161F] p-4"
              >
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    onClick={() => handleReplaceClick(logo.name)}
                    disabled={replacingLogo === logo.name}
                    className="text-[#7FA8D9] hover:text-[#9BBEE5] disabled:opacity-40"
                    title={`Substituir "${logo.name}" (mantém o mesmo nome)`}
                  >
                    <RefreshCw className={replacingLogo === logo.name ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  </button>

                  <button
                    onClick={() => handleDelete(logo.name)}
                    className="text-red-400/80 hover:text-red-400"
                    title={`Excluir "${logo.name}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <img
                  src={`/logos/${logo.name}${cacheBust[logo.name] ? `?t=${cacheBust[logo.name]}` : ""}`}
                  className="h-24 w-full rounded-lg bg-white object-contain"
                />

                <p className="mt-2 truncate text-xs text-[#9AA1AC]">{logo.name}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
