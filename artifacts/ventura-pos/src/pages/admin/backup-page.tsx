import { useState, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { PremiumBackground } from "@/components/premium-background";
import { Download, Upload, Database, AlertTriangle, Check } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultado, setResultado] = useState<{ stats?: Record<string, number>; modo?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function descargar() {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup", { credentials: "include" });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tiamo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("No se pudo descargar el backup");
    } finally {
      setDownloading(false);
    }
  }

  async function subir(modo: "merge" | "replace") {
    const f = fileRef.current?.files?.[0];
    if (!f) { setError("Seleccioná primero un archivo .json"); return; }
    setError(null);
    setResultado(null);
    setUploading(true);
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (!data.tables) throw new Error("Archivo inválido (no es un backup TIAMO)");
      const r = await customFetch<{ ok: boolean; modo: string; stats: Record<string, number> }>("/api/admin/restore", {
        method: "POST",
        body: JSON.stringify({ tables: data.tables, modo }),
      });
      setResultado({ stats: r.stats, modo: r.modo });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al restaurar");
    } finally {
      setUploading(false);
      setConfirmReplace(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <PremiumBackground />
      <Navigation />
      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center icon-3d">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">Backup &amp; Restauración</h1>
            <p className="text-zinc-500 text-sm">Exportá toda tu base o restaurala desde un archivo</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Backup */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-display font-black text-white">Descargar backup</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-5">Genera un archivo JSON con productos, mesas, usuarios, pedidos, sesiones de caja y configuración. Guardalo en un lugar seguro.</p>
            <button onClick={descargar} disabled={downloading}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 lift-hover">
              <Download className="w-4 h-4" />
              {downloading ? "Generando..." : "Descargar JSON"}
            </button>
          </div>

          {/* Restore */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-display font-black text-white">Restaurar backup</h2>
            </div>
            <p className="text-sm text-zinc-400 mb-5">Subí un archivo .json previamente exportado. Modo <strong className="text-white">unir</strong> agrega registros nuevos; <strong className="text-white">reemplazar</strong> borra los actuales.</p>
            <input type="file" accept=".json,application/json" ref={fileRef} className="block w-full text-xs text-zinc-400 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:font-bold file:cursor-pointer mb-3" />
            <div className="flex gap-2">
              <button onClick={() => subir("merge")} disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs disabled:opacity-50 hover:bg-white/15">
                {uploading ? "Subiendo..." : "Unir"}
              </button>
              <button onClick={() => setConfirmReplace(true)} disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs disabled:opacity-50 hover:bg-red-500/30">
                Reemplazar todo
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {resultado && (
          <div className="mt-4 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-black text-emerald-300">Restauración completada ({resultado.modo})</h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-xs">
              {Object.entries(resultado.stats ?? {}).map(([k, v]) => (
                <div key={k} className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-zinc-400 text-[10px] uppercase tracking-wide">{k}</div>
                  <div className="text-white font-black">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {confirmReplace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-card rounded-2xl p-6 max-w-md">
              <div className="flex items-center gap-2 mb-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-display font-black text-lg">¿Reemplazar todos los datos?</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-5">Se eliminarán <strong className="text-white">todos los pedidos, sesiones de caja, productos y promociones actuales</strong> y se reemplazarán por los del archivo. Esta acción NO se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmReplace(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 text-sm">Cancelar</button>
                <button onClick={() => subir("replace")} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">Sí, reemplazar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
