import { useState, useRef } from "react";
import {
  useGetProductos,
  useCrearProducto,
  useActualizarProducto,
  useEliminarProducto,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, MENU_CATEGORIAS } from "@/lib/constants";
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, X, Save,
  ImageIcon, Upload, AlertCircle, Package
} from "lucide-react";
import { RecordExportBar } from "@/components/record-export-bar";

interface ProductoForm {
  nombre: string;
  descripcion: string;
  precio: string;
  emoji: string;
  imagenUrl: string;
  categoria: string;
  disponible: boolean;
  destacado: boolean;
  posicion: string;
}

const emptyForm = (): ProductoForm => ({
  nombre: "",
  descripcion: "",
  precio: "",
  emoji: "",
  imagenUrl: "",
  categoria: "hamburguesas",
  disponible: true,
  destacado: false,
  posicion: "0",
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminProductosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [catFiltro, setCatFiltro] = useState("todos");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductoForm>(emptyForm());
  const [uploadingImg, setUploadingImg] = useState(false);

  const { data: productos, isLoading } = useGetProductos();
  const crearMutation = useCrearProducto();
  const actualizarMutation = useActualizarProducto();
  const eliminarMutation = useEliminarProducto();

  const filtrados = catFiltro === "todos" ? (productos ?? []) : (productos ?? []).filter((p) => p.categoria === catFiltro);

  const handleImageFile = async (file: File) => {
    setUploadingImg(true);
    try {
      // Compress/resize using canvas
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((res) => { img.onload = res; img.src = url; });
      const canvas = document.createElement("canvas");
      const MAX = 800;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const r = await fetch(`${BASE}/api/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: dataUrl }),
      });
      if (!r.ok) throw new Error("Upload failed");
      const { url: imgUrl } = await r.json();
      setForm((f) => ({ ...f, imagenUrl: imgUrl }));
      toast({ title: "Imagen subida correctamente" });
    } catch {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precio: String(p.precio),
      emoji: p.emoji ?? "",
      imagenUrl: p.imagenUrl ?? "",
      categoria: p.categoria,
      disponible: p.disponible,
      destacado: p.destacado,
      posicion: String(p.posicion),
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const handleSave = () => {
    const precioNum = Number(form.precio.replace(/[^0-9]/g, ""));
    const posicionNum = Number(form.posicion.replace(/[^0-9]/g, "")) || 0;

    const data = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      precio: precioNum,
      emoji: form.emoji || "•",
      imagenUrl: form.imagenUrl.trim() || undefined,
      categoria: form.categoria,
      disponible: form.disponible,
      destacado: form.destacado,
      posicion: posicionNum,
    };

    if (!data.nombre) {
      toast({ title: "Nombre requerido", description: "Escribe el nombre del producto", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(data.precio) || data.precio <= 0) {
      toast({ title: "Precio inválido", description: "Ingresa un precio válido mayor a 0", variant: "destructive" });
      return;
    }
    if (!data.categoria) {
      toast({ title: "Categoría requerida", description: "Selecciona una categoría", variant: "destructive" });
      return;
    }

    try {
      if (editingId !== null) {
        actualizarMutation.mutate(
          { id: editingId, data },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["getProductos"] });
              toast({ title: "Producto actualizado" });
              setShowForm(false);
            },
            onError: (err: any) => toast({ title: "Error al actualizar", description: err?.message || "Inténtalo de nuevo", variant: "destructive" }),
          },
        );
      } else {
        crearMutation.mutate(
          { data: { ...data, nombre: data.nombre, precio: data.precio, categoria: data.categoria } },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: ["getProductos"] });
              toast({ title: "Producto creado" });
              setShowForm(false);
              setForm(emptyForm());
            },
            onError: (err: any) => toast({ title: "Error al crear", description: err?.message || "Verifica los datos e inténtalo de nuevo", variant: "destructive" }),
          },
        );
      }
    } catch (e: any) {
      toast({ title: "Error inesperado", description: e?.message ?? "Ocurrió un error", variant: "destructive" });
    }
  };

  const handleToggle = (id: number, field: "disponible" | "destacado", val: boolean) => {
    actualizarMutation.mutate(
      { id, data: { [field]: val } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["getProductos"] }),
        onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
      },
    );
  };

  const handleDelete = (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    eliminarMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getProductos"] });
          toast({ title: "Producto eliminado" });
        },
        onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20 md:pb-0">
      <Navigation />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
      />

      <div className="max-w-screen-xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight font-display">Catálogo de Productos</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{productos?.length ?? 0} productos · {productos?.filter((p) => p.disponible).length ?? 0} disponibles</p>
          </div>
          <div className="flex items-center gap-2">
            <RecordExportBar
              title="Catálogo de Productos"
              filename={`productos-${new Date().toISOString().slice(0,10)}`}
              subtitle={`${productos?.length ?? 0} productos`}
              rows={(productos ?? []).map((p) => ({
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                precio: p.precio,
                disponible: p.disponible ? "Sí" : "No",
                destacado: p.destacado ? "Sí" : "No",
                emoji: p.emoji ?? "",
              }))}
            />
            <Button onClick={handleNew} className="font-bold gap-2 ml-1" style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }}>
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setCatFiltro("todos")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${catFiltro === "todos" ? "bg-red-600 text-white shadow-sm" : "bg-white/5 text-zinc-400 hover:bg-white/8 border border-white/5"}`}
          >
            Todos ({productos?.length ?? 0})
          </button>
          {MENU_CATEGORIAS.map((cat) => {
            const count = productos?.filter((p) => p.categoria === cat.id).length ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => setCatFiltro(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${catFiltro === cat.id ? "bg-red-600 text-white shadow-sm" : "bg-white/5 text-zinc-400 hover:bg-white/8 border border-white/5"}`}
              >
                {cat.emoji} {cat.nombre} ({count})
              </button>
            );
          })}
        </div>

        {/* Products table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-semibold">Sin productos en esta categoría</p>
            <p className="text-zinc-700 text-sm mt-1">Crea el primero con el botón "Nuevo Producto"</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3">Producto</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Categoría</th>
                  <th className="text-right text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3">Precio</th>
                  <th className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Estado</th>
                  <th className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Dest.</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className={`border-b border-white/5 transition-colors hover:bg-white/2 ${!p.disponible ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imagenUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { (e.target as any).parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl">${p.emoji || "?"}</div>`; }} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl shrink-0 border border-white/5">
                            {p.emoji || <ImageIcon className="w-4 h-4 text-zinc-600" />}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white text-sm leading-tight">{p.nombre}</p>
                          {p.descripcion && <p className="text-zinc-600 text-xs truncate max-w-[180px] mt-0.5">{p.descripcion}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-zinc-400 text-xs font-medium capitalize">
                        {MENU_CATEGORIAS.find((c) => c.id === p.categoria)?.nombre ?? p.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-white text-sm">{formatPrice(p.precio)}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <button
                        onClick={() => handleToggle(p.id, "disponible", !p.disponible)}
                        className={`flex items-center gap-1 mx-auto px-2 py-1 rounded-lg text-xs font-bold transition-all ${p.disponible ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"}`}
                      >
                        {p.disponible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {p.disponible ? "Activo" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <button
                        onClick={() => handleToggle(p.id, "destacado", !p.destacado)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all ${p.destacado ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-zinc-600 hover:text-amber-400"}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${p.destacado ? "fill-amber-400" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.nombre)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-lg rounded-3xl border overflow-hidden" style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-black text-white text-lg">{editingId !== null ? "Editar Producto" : "Nuevo Producto"}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Imagen */}
              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider block mb-2">Imagen del producto</label>
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                    {form.imagenUrl ? (
                      <img src={form.imagenUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = "none"; }} />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-zinc-300 hover:text-white hover:border-white/20 gap-2 h-9 text-sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingImg}
                    >
                      {uploadingImg
                        ? <><div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Subiendo...</>
                        : <><Upload className="w-4 h-4" />Subir desde galería</>
                      }
                    </Button>
                    <Input
                      value={form.imagenUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imagenUrl: e.target.value }))}
                      placeholder="o pega una URL de imagen"
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700 text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Nombre *</label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Tiamo Burger"
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Emoji</label>
                  <Input
                    value={form.emoji}
                    onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                    placeholder="🍔"
                    className="bg-white/5 border-white/10 text-white text-center text-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Descripción</label>
                <Textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Pan brioche, carne de res, tocineta, queso..."
                  className="resize-none h-16 bg-white/5 border-white/10 text-white placeholder:text-zinc-700 mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Precio (COP) *</label>
                  <Input
                    type="number"
                    value={form.precio}
                    onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                    placeholder="17000"
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Categoría *</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                    className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white text-sm px-3"
                  >
                    {MENU_CATEGORIAS.map((c) => (
                      <option key={c.id} value={c.id} className="bg-zinc-900">{c.emoji} {c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm((f) => ({ ...f, disponible: !f.disponible }))} className={`relative w-9 h-5 rounded-full transition-colors ${form.disponible ? "bg-emerald-500" : "bg-zinc-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.disponible ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-zinc-400">Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm((f) => ({ ...f, destacado: !f.destacado }))} className={`relative w-9 h-5 rounded-full transition-colors ${form.destacado ? "bg-amber-500" : "bg-zinc-700"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.destacado ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-zinc-400">Destacado</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex gap-3">
              <Button variant="outline" className="border-white/10 text-zinc-400 hover:text-white flex-1" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 font-bold gap-2"
                style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
                {editingId !== null ? "Guardar Cambios" : "Crear Producto"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
