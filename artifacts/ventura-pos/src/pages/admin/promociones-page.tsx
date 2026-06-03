import { useState, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  Plus, Pencil, Trash2, X, Save, Tag, ToggleLeft, ToggleRight,
  Percent, DollarSign, Clock, Calendar, ImageIcon, Upload
} from "lucide-react";
import { formatPrice } from "@/lib/constants";

interface Promocion {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: "descuento" | "combo" | "2x1" | "happy_hour";
  descuento?: number;
  tipoDescuento: "porcentaje" | "fijo";
  activo: boolean;
  diasSemana?: string;
  horaInicio?: string;
  horaFin?: string;
  imagenUrl?: string;
  creadoEn: string;
}

const emptyForm = (): Omit<Promocion, "id" | "creadoEn"> => ({
  nombre: "",
  descripcion: "",
  tipo: "descuento",
  descuento: undefined,
  tipoDescuento: "porcentaje",
  activo: true,
  diasSemana: "",
  horaInicio: "",
  horaFin: "",
  imagenUrl: "",
});

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  descuento: { label: "Descuento", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  combo: { label: "Combo", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  "2x1": { label: "2x1", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  happy_hour: { label: "Happy Hour", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchPromos(token: string): Promise<Promocion[]> {
  const r = await fetch(`${BASE}/api/promociones`, { credentials: "include", headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Error al cargar");
  return r.json();
}

export default function PromocionesPage() {
  const { toast } = useToast();
  const { token } = useAuth() as any;
  const fileRef = useRef<HTMLInputElement>(null);

  const [promos, setPromos] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const diasActivos = form.diasSemana ? form.diasSemana.split(",").filter(Boolean) : [];

  const loadPromos = async () => {
    setLoading(true);
    try {
      const data = await fetchPromos(token ?? "");
      setPromos(data);
    } catch {
      toast({ title: "Error al cargar promociones", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useState(() => { loadPromos(); });

  const handleImageFile = async (file: File) => {
    setUploadingImg(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload = (e) => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const r = await fetch(`${BASE}/api/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUrl }),
      });
      if (!r.ok) throw new Error("Upload failed");
      const { url } = await r.json();
      setForm((f) => ({ ...f, imagenUrl: url }));
      toast({ title: "Imagen subida correctamente" });
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        diasSemana: diasActivos.join(",") || undefined,
        descuento: form.descuento ?? undefined,
        imagenUrl: form.imagenUrl || undefined,
      };
      const url = editingId !== null ? `${BASE}/api/promociones/${editingId}` : `${BASE}/api/promociones`;
      const method = editingId !== null ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast({ title: editingId !== null ? "Promoción actualizada" : "Promoción creada" });
      setShowForm(false);
      loadPromos();
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: Promocion) => {
    try {
      await fetch(`${BASE}/api/promociones/${promo.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !promo.activo }),
      });
      loadPromos();
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (promo: Promocion) => {
    if (!confirm(`¿Eliminar "${promo.nombre}"?`)) return;
    try {
      await fetch(`${BASE}/api/promociones/${promo.id}`, { method: "DELETE", credentials: "include" });
      toast({ title: "Promoción eliminada" });
      loadPromos();
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const handleEdit = (p: Promocion) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      tipo: p.tipo,
      descuento: p.descuento,
      tipoDescuento: p.tipoDescuento,
      activo: p.activo,
      diasSemana: p.diasSemana ?? "",
      horaInicio: p.horaInicio ?? "",
      horaFin: p.horaFin ?? "",
      imagenUrl: p.imagenUrl ?? "",
    });
    setShowForm(true);
  };

  const toggleDia = (dia: string) => {
    const current = form.diasSemana ? form.diasSemana.split(",").filter(Boolean) : [];
    const updated = current.includes(dia) ? current.filter((d) => d !== dia) : [...current, dia];
    setForm((f) => ({ ...f, diasSemana: updated.join(",") }));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20 md:pb-0">
      <Navigation />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />

      <main className="max-w-screen-xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display">Promociones</h1>
            <p className="text-zinc-500 text-sm mt-1">{promos.length} promociones · {promos.filter((p) => p.activo).length} activas</p>
          </div>
          <Button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(true); }} className="font-bold gap-2" style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }}>
            <Plus className="w-4 h-4" /> Nueva Promoción
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-500 mb-2">Sin promociones</h3>
            <p className="text-sm text-zinc-600 mb-6">Crea combos, descuentos y happy hours</p>
            <Button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(true); }} variant="outline" className="border-white/10 text-zinc-400 hover:text-white">
              Crear primera promoción
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((p) => {
              const tipoInfo = TIPO_LABELS[p.tipo] ?? TIPO_LABELS.descuento;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border overflow-hidden transition-all duration-200 ${p.activo ? "border-white/10" : "border-white/5 opacity-60"}`}
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  {p.imagenUrl && (
                    <div className="h-32 overflow-hidden">
                      <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                        <h3 className="font-black text-white text-base mt-1.5">{p.nombre}</h3>
                        {p.descripcion && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{p.descripcion}</p>}
                      </div>
                      {p.descuento != null && (
                        <div className="shrink-0 text-right">
                          <div className="text-lg font-black" style={{ color: "#FF2D2D" }}>
                            {p.tipoDescuento === "porcentaje" ? `${p.descuento}%` : formatPrice(p.descuento)}
                          </div>
                          <div className="text-[10px] text-zinc-600">OFF</div>
                        </div>
                      )}
                    </div>

                    {(p.diasSemana || p.horaInicio) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {p.diasSemana && p.diasSemana.split(",").filter(Boolean).map((d) => (
                          <span key={d} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-500 font-medium capitalize">{d}</span>
                        ))}
                        {p.horaInicio && p.horaFin && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-500 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{p.horaInicio} - {p.horaFin}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button onClick={() => handleToggle(p)} className={`flex items-center gap-1.5 flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${p.activo ? "text-emerald-400 hover:bg-emerald-500/10" : "text-zinc-600 hover:bg-white/5"}`}>
                        {p.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {p.activo ? "Activa" : "Inactiva"}
                      </button>
                      <button onClick={() => handleEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-lg rounded-3xl border overflow-hidden" style={{ background: "#111", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-black text-white text-lg">{editingId !== null ? "Editar" : "Nueva"} Promoción</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5">Nombre *</label>
                <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="2x1 Hamburguesas" className="bg-white/5 border-white/10 text-white" />
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5">Descripción</label>
                <Textarea value={form.descripcion ?? ""} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Detalles de la promoción..." className="bg-white/5 border-white/10 text-white resize-none h-16" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5">Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as any }))} className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3">
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v} className="bg-zinc-900">{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5">Descuento</label>
                  <div className="flex gap-2">
                    <Input type="number" value={form.descuento ?? ""} onChange={(e) => setForm((f) => ({ ...f, descuento: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="15" className="bg-white/5 border-white/10 text-white flex-1" />
                    <button onClick={() => setForm((f) => ({ ...f, tipoDescuento: f.tipoDescuento === "porcentaje" ? "fijo" : "porcentaje" }))} className="px-3 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-colors">
                      {form.tipoDescuento === "porcentaje" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-2">
                  <Calendar className="w-3 h-3 inline mr-1" />Días de la semana
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((d) => (
                    <button key={d} onClick={() => toggleDia(d)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize border ${diasActivos.includes(d) ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20"}`}>
                      {d.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5"><Clock className="w-3 h-3 inline mr-1" />Hora inicio</label>
                  <Input type="time" value={form.horaInicio ?? ""} onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5"><Clock className="w-3 h-3 inline mr-1" />Hora fin</label>
                  <Input type="time" value={form.horaFin ?? ""} onChange={(e) => setForm((f) => ({ ...f, horaFin: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-1.5">Imagen</label>
                <div className="flex gap-2">
                  <Input value={form.imagenUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))} placeholder="URL o sube desde galería" className="bg-white/5 border-white/10 text-white text-xs flex-1" />
                  <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="border-white/10 text-zinc-400 hover:text-white shrink-0">
                    {uploadingImg ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
                {form.imagenUrl && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={form.imagenUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = "none"; }} />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-2">
                <div onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))} className={`relative w-10 h-5 rounded-full transition-colors ${form.activo ? "bg-emerald-500" : "bg-zinc-700"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.activo ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-zinc-300 font-medium">Promoción activa</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex gap-3">
              <Button variant="outline" className="border-white/10 text-zinc-400 flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="flex-1 font-bold gap-2" style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }} disabled={saving} onClick={handleSave}>
                <Save className="w-4 h-4" />{saving ? "Guardando..." : editingId !== null ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
