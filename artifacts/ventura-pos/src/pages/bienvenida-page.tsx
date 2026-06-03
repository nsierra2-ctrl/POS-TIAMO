import { useState, useEffect, FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { customFetch } from "@workspace/api-client-react";
import { getConfiguracion, updateConfiguracion } from "@/lib/configuracion";
import { PremiumBackground } from "@/components/premium-background";
import { Check, ChefHat, Building2, KeyRound, Sparkles, ArrowRight } from "lucide-react";

type Paso = 1 | 2 | 3 | 4;

export default function BienvenidaPage() {
  const [, setLocation] = useLocation();
  const { usuario } = useAuth();
  const [paso, setPaso] = useState<Paso>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1: cambiar contraseña Carlos
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  // Paso 2: datos negocio
  const [nombre, setNombre] = useState("TIAMO BURGER");
  const [slogan, setSlogan] = useState("La hamburguesa que te enamora");
  const [ruc, setRuc] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [ciudad, setCiudad] = useState("");

  // Paso 3: logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getConfiguracion().then((c) => {
      if (c.nombreNegocio) setNombre(c.nombreNegocio);
      if (c.slogan) setSlogan(c.slogan);
      if (c.ruc) setRuc(c.ruc);
      if (c.direccion) setDireccion(c.direccion);
      if (c.telefono) setTelefono(c.telefono);
      if (c.email) setEmail(c.email);
      if (c.instagram) setInstagram(c.instagram);
      if (c.ciudad) setCiudad(c.ciudad);
      if (c.logoUrl) setLogoUrl(c.logoUrl);
    }).catch(() => {});
  }, []);

  if (!usuario || usuario.rol !== "admin") {
    setLocation("/login");
    return null;
  }

  async function handlePaso1(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (pwd.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (pwd !== pwd2) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try {
      await customFetch(`/api/usuarios/${usuario!.id}`, {
        method: "PUT",
        body: JSON.stringify({ contrasena: pwd }),
      });
      setPaso(2);
    } catch {
      setError("Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaso2(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateConfiguracion({ nombreNegocio: nombre, slogan, ruc, direccion, telefono, email, instagram, ciudad });
      setPaso(3);
    } catch {
      setError("Error al guardar datos del negocio");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const r = await customFetch<{ url: string }>("/api/upload", {
          method: "POST",
          body: JSON.stringify({ imageData: dataUrl }),
        });
        await updateConfiguracion({ logoUrl: r.url });
        setLogoUrl(r.url);
        setLoading(false);
      };
      reader.readAsDataURL(f);
    } catch {
      setError("Error al subir logo");
      setLoading(false);
    }
  }

  async function finalizar() {
    setLoading(true);
    try {
      await updateConfiguracion({ configurado: true });
      setPaso(4);
      setTimeout(() => setLocation("/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 brand-gradient-bg">
      <PremiumBackground />
      <div className="w-full max-w-2xl glass-card rounded-3xl p-8 md:p-10 relative z-10">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  paso >= n
                    ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_20px_rgba(255,45,45,0.5)]"
                    : "bg-white/5 text-zinc-500 border border-white/10"
                }`}
              >
                {paso > n ? <Check className="w-4 h-4" /> : n}
              </div>
              {n < 4 && <div className={`w-10 h-0.5 mx-1 ${paso > n ? "bg-red-500" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {paso === 1 && (
          <form onSubmit={handlePaso1} className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center icon-3d">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-display font-black text-white">Bienvenido, {usuario.nombre}</h1>
              <p className="text-sm text-zinc-400 mt-1">Cambiá tu contraseña antes de empezar</p>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Nueva contraseña</label>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition" />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Confirmar</label>
              <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPaso(2)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 text-sm">Más tarde</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? "Guardando..." : <>Continuar <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={handlePaso2} className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center icon-3d">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-display font-black text-white">Datos del negocio</h1>
              <p className="text-sm text-zinc-400 mt-1">Aparecerán en facturas, tickets y reportes</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Nombre del local *</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Slogan</label>
                <input value={slogan} onChange={(e) => setSlogan(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">NIT / RUC</label>
                <input value={ruc} onChange={(e) => setRuc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Teléfono</label>
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Dirección</label>
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Ciudad</label>
                <input value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5 block">Instagram (sin @)</label>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-red-500 outline-none transition text-sm" />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPaso(1)} className="px-4 py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 text-sm">Atrás</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? "Guardando..." : <>Continuar <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        )}

        {paso === 3 && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center icon-3d">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-display font-black text-white">Logo del negocio</h1>
              <p className="text-sm text-zinc-400 mt-1">Opcional — aparecerá en facturas y tickets</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-32 h-32 rounded-2xl object-cover border-2 border-red-500/40" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-zinc-600 text-4xl">🍔</div>
              )}
              <label className="px-4 py-2.5 rounded-xl glass-button cursor-pointer text-sm text-white font-bold">
                {logoUrl ? "Cambiar logo" : "Subir logo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPaso(2)} className="px-4 py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 text-sm">Atrás</button>
              <button type="button" onClick={finalizar} disabled={loading} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? "Guardando..." : <>Finalizar configuración <Sparkles className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="text-center py-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center caja-pulse-emerald">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-black text-white mb-2">¡Todo listo, {usuario.nombre}!</h1>
            <p className="text-zinc-400">Llevándote al panel principal...</p>
          </div>
        )}
      </div>
    </div>
  );
}
