import { useState, useEffect, FormEvent } from "react";
import { Navigation } from "@/components/navigation";
import { PremiumBackground } from "@/components/premium-background";
import { customFetch } from "@workspace/api-client-react";
import { getConfiguracion, updateConfiguracion, type Configuracion } from "@/lib/configuracion";
import { Save, Building2, ImageUp, Check } from "lucide-react";

export default function ConfiguracionPage() {
  const [cfg, setCfg] = useState<Configuracion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getConfiguracion().then((c) => { setCfg(c); setLoading(false); });
  }, []);

  if (loading || !cfg) return <div className="p-10 text-zinc-400">Cargando...</div>;

  function set<K extends keyof Configuracion>(k: K, v: Configuracion[K]) {
    setCfg((c) => c ? { ...c, [k]: v } : c);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!cfg) return;
    setSaving(true);
    try {
      const out = await updateConfiguracion(cfg);
      setCfg(out);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } finally {
      setSaving(false);
    }
  }

  async function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const r = await customFetch<{ url: string }>("/api/upload", {
        method: "POST",
        body: JSON.stringify({ imageData: reader.result as string }),
      });
      const out = await updateConfiguracion({ logoUrl: r.url });
      setCfg(out);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <PremiumBackground />
      <Navigation />
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center icon-3d">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">Configuración del negocio</h1>
            <p className="text-zinc-500 text-sm">Datos que aparecen en facturas, tickets y reportes</p>
          </div>
        </div>

        <form onSubmit={onSave} className="glass-card rounded-2xl p-6 space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-5 pb-5 border-b border-white/5">
            {cfg.logoUrl ? (
              <img src={cfg.logoUrl} alt="logo" className="w-20 h-20 rounded-xl object-cover border border-red-500/30" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-3xl">🍔</div>
            )}
            <div>
              <label className="px-4 py-2 rounded-lg glass-button cursor-pointer text-sm text-white font-bold inline-flex items-center gap-2">
                <ImageUp className="w-4 h-4" />
                {cfg.logoUrl ? "Cambiar logo" : "Subir logo"}
                <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
              </label>
              <p className="text-xs text-zinc-500 mt-2">PNG/JPG · idealmente cuadrado, 512×512 px</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre del negocio *" value={cfg.nombreNegocio} onChange={(v) => set("nombreNegocio", v)} className="col-span-2" />
            <Field label="Slogan" value={cfg.slogan ?? ""} onChange={(v) => set("slogan", v)} className="col-span-2" />
            <Field label="NIT / RUC" value={cfg.ruc ?? ""} onChange={(v) => set("ruc", v)} />
            <Field label="Teléfono" value={cfg.telefono ?? ""} onChange={(v) => set("telefono", v)} />
            <Field label="Dirección" value={cfg.direccion ?? ""} onChange={(v) => set("direccion", v)} className="col-span-2" />
            <Field label="Ciudad" value={cfg.ciudad ?? ""} onChange={(v) => set("ciudad", v)} />
            <Field label="Moneda (cód. ISO)" value={cfg.moneda} onChange={(v) => set("moneda", v)} />
            <Field label="Email" value={cfg.email ?? ""} onChange={(v) => set("email", v)} />
            <Field label="Instagram (sin @)" value={cfg.instagram ?? ""} onChange={(v) => set("instagram", v)} />
            <Field label="Prefijo de factura" value={cfg.prefijoFactura ?? ""} onChange={(v) => set("prefijoFactura", v)} />
            <Field label="Mensaje al pie del ticket" value={cfg.mensajeFactura ?? ""} onChange={(v) => set("mensajeFactura", v)} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            {saved && <span className="text-emerald-400 text-sm flex items-center gap-1.5"><Check className="w-4 h-4" /> Guardado</span>}
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50 lift-hover">
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
    </div>
  );
}
