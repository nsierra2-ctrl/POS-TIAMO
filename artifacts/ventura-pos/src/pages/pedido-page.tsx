import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { OrderConfirmAnimation } from "@/components/order-confirm-animation";
import {
  useGetProductos,
  useCrearPedido,
  useActualizarMesa,
  getGetMesasQueryKey,
  getGetPedidosQueryKey,
  getGetProductosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { formatPrice, MENU_CATEGORIAS, CATEGORIA_COLORS, CATEGORIA_ACCENT } from "@/lib/constants";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  Star,
  AlertCircle,
  Usb,
} from "lucide-react";
import { useLocalPrinter } from "@/hooks/use-local-printer";

interface CartItem {
  id: string;
  productoId: number;
  nombre: string;
  emoji: string;
  precio: number;
  cantidad: number;
  observaciones?: string;
}

interface ProductoModal {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  emoji: string;
  imagenUrl?: string | null;
  categoria: string;
  disponible: boolean;
  destacado: boolean;
}

export default function PedidoPage() {
  const [, setLocation] = useLocation();
  const { usuario } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mesaStr = sessionStorage.getItem("mesaActual");
  const mesaNum = mesaStr ?? "01";
  const personasStr = sessionStorage.getItem("personasActual");
  const pedidoActualIdStr = sessionStorage.getItem("pedidoActualId");
  const pedidoActualId = pedidoActualIdStr ? parseInt(pedidoActualIdStr) : null;
  const pedidoActualItemsRaw = sessionStorage.getItem("pedidoActualItems");
  const pedidoActualItems = pedidoActualItemsRaw ? JSON.parse(pedidoActualItemsRaw) : [];

  const [categoriaActiva, setCategoriaActiva] = useState("burgers");
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (pedidoActualItems.length > 0) {
      return pedidoActualItems.map((it: any, idx: number) => ({
        id: it.id || `existing-${idx}-${Date.now()}`,
        productoId: it.productoId ?? null,
        nombre: it.nombre,
        emoji: it.emoji || "",
        precio: it.precio,
        cantidad: it.cantidad,
        observaciones: it.observaciones,
      }));
    }
    return [];
  });
  const [notasGenerales, setNotasGenerales] = useState("");
  const [showCart, setShowCart] = useState(true);
  const [modalProducto, setModalProducto] = useState<ProductoModal | null>(null);
  const [modalCantidad, setModalCantidad] = useState(1);
  const [modalObs, setModalObs] = useState("");
  const [confirmado, setConfirmado] = useState<{ id: number } | null>(null);
  const [showAnim, setShowAnim] = useState(false);
  const localPrinter = useLocalPrinter();

  const productoParams = { soloDisponibles: true };
  const { data: productos, isLoading } = useGetProductos(productoParams, {
    query: { queryKey: getGetProductosQueryKey(productoParams) },
  });

  const crearPedidoMutation = useCrearPedido();
  const actualizarMesaMutation = useActualizarMesa();
  const [actualizandoPedido, setActualizandoPedido] = useState(false);

  const productosFiltrados = productos?.filter((p) => p.categoria === categoriaActiva) ?? [];
  const totalCarrito = cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const cantidadCarrito = cart.reduce((sum, i) => sum + i.cantidad, 0);

  const abrirModal = (producto: ProductoModal) => {
    setModalProducto(producto);
    setModalCantidad(1);
    setModalObs("");
  };

  const cerrarModal = () => {
    setModalProducto(null);
    setModalCantidad(1);
    setModalObs("");
  };

  const agregarAlCarrito = useCallback(() => {
    if (!modalProducto) return;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productoId === modalProducto.id && !i.observaciones && !modalObs.trim(),
      );
      if (existingIdx >= 0 && !modalObs.trim()) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          cantidad: updated[existingIdx].cantidad + modalCantidad,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `${modalProducto.id}-${Date.now()}`,
          productoId: modalProducto.id,
          nombre: modalProducto.nombre,
          emoji: modalProducto.emoji,
          precio: modalProducto.precio,
          cantidad: modalCantidad,
          observaciones: modalObs.trim() || undefined,
        },
      ];
    });

    cerrarModal();
    setShowCart(true);
  }, [modalProducto, modalCantidad, modalObs]);

  const eliminarItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const actualizarCantidad = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0),
    );
  };

  const buildComandaText = (pedidoId: number) => {
    const LINE = 30;
    const pad = (l: string, r: string) => {
      const s = LINE - l.length - r.length;
      return l + " ".repeat(Math.max(1, s)) + r;
    };
    const div = (c = "-") => c.repeat(LINE);
    const ctr = (s: string) => " ".repeat(Math.max(0, Math.floor((LINE - s.length) / 2))) + s;
    const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    const fecha = new Date().toLocaleDateString("es-CO");
    const lines: string[] = [
      div("="),
      ctr("TIAMO BURGER"),
      ctr("COMANDA COCINA"),
      div("="),
      ctr(`#${String(pedidoId).padStart(4, "0")}`),
      div("-"),
      `Mesa:${mesaNum}  ${hora} ${fecha}`,
      div("-"),
    ];
    for (const i of cart) {
      const name = `${i.cantidad}x ${i.emoji} ${i.nombre}`;
      const max = LINE - 8;
      const display = name.length > max ? name.substring(0, max - 1) + "." : name;
      const price = formatPrice(i.precio * i.cantidad);
      lines.push(pad(display, price));
      if (i.observaciones) lines.push(`  * ${i.observaciones.substring(0, LINE - 4)}`);
    }
    lines.push(div("-"));
    if (notasGenerales) lines.push(`Notas:${notasGenerales}`);
    lines.push(pad("TOTAL:", formatPrice(totalCarrito)));
    lines.push(div("="));
    lines.push(`Mesero:${usuario?.nombre ?? "-"}`);
    lines.push(div("="));
    return lines.join("\n") + "\n";
  };

  const buildComandaHtml = (pedidoId: number) => {
    const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    const fecha = new Date().toLocaleDateString("es-CO");
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Comanda TIAMO BURGER</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:11px;width:58mm;padding:4px;background:#fff;color:#000}
      .c{text-align:center}.t{font-size:14px;font-weight:bold}.d{border-top:1px dashed #000;margin:4px 0}
      .row{display:flex;justify-content:space-between;padding:1px 0}.obs{font-size:9px;color:#555;padding-left:8px;font-style:italic}
      .total{font-size:12px;font-weight:bold}.turno{font-size:28px;font-weight:900;text-align:center;margin:4px 0}
      @media print{@page{margin:0;size:58mm auto}body{padding:2px}}
    </style></head><body>
      <div class="c t">TIAMO BURGER</div>
      <div class="c" style="font-size:9px">COMANDA COCINA</div>
      <div class="d"></div>
      <div class="turno">#${String(pedidoId).padStart(4, "0")}</div>
      <div class="d"></div>
      <div>Mesa:${mesaNum} ${hora} ${fecha}</div>
      <div class="d"></div>
      ${cart.map((i) => `<div class="row"><span>${i.cantidad}x ${i.emoji} ${i.nombre}</span><span>${formatPrice(i.precio * i.cantidad)}</span></div>${i.observaciones ? `<div class="obs">* ${i.observaciones}</div>` : ""}`).join("")}
      <div class="d"></div>
      ${notasGenerales ? `<div style="font-size:9px">Notas:${notasGenerales}</div><div class="d"></div>` : ""}
      <div class="row total"><span>TOTAL</span><span>${formatPrice(totalCarrito)}</span></div>
      <div class="d"></div>
      <div class="c" style="font-size:9px">Mesero:${usuario?.nombre ?? "-"}</div>
    </body></html>`;
  };

  const imprimirComanda = (pedidoId: number) => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
      toast({ title: "Permita ventanas emergentes", description: "El navegador bloqueo la ventana de impresion", variant: "destructive" });
      return;
    }
    win.document.write(buildComandaHtml(pedidoId) + `<script>window.onload=()=>{setTimeout(()=>{window.print();},300);}</script>`);
    win.document.close();
  };

  const shareComanda = (pedidoId: number) => {
    const text = `🍔 *TIAMO BURGER - Comanda #${String(pedidoId).padStart(4, "0")}*\n` +
      `Mesa ${mesaNum}\n\n` +
      cart.map(i => `${i.cantidad}x ${i.emoji} ${i.nombre} - ${formatPrice(i.precio * i.cantidad)}`).join("\n") +
      `\n\n*Total:* ${formatPrice(totalCarrito)}\nMesero: ${usuario?.nombre ?? "-"}`;

    if (navigator.share) {
      navigator.share({ title: `Comanda #${pedidoId}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Comanda copiada", description: "Pega en WhatsApp o mensaje" });
      });
    }
  };

  const handleConfirmar = async () => {
    if (cart.length === 0) return;

    const itemsPayload = cart.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      emoji: i.emoji,
      precio: i.precio,
      cantidad: i.cantidad,
      observaciones: i.observaciones,
    }));

    // Si es un pedido existente, usamos PATCH para agregar/modificar items
    if (pedidoActualId) {
      setActualizandoPedido(true);
      try {
        const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
        const r = await fetch(`${BASE}/api/pedidos/${pedidoActualId}/items`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: itemsPayload,
            total: totalCarrito,
            nota: notasGenerales.trim() || undefined,
          }),
        });
        if (!r.ok) throw new Error("Error al actualizar pedido");
        const pedido = await r.json();
        queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
        setConfirmado({ id: pedido.id });
        setShowAnim(true);
        imprimirComanda(pedido.id);
        const ticket = buildComandaText(pedido.id);
        const res = await localPrinter.print(ticket);
        if (!res.ok) {
          toast({ title: "Comanda web OK", description: `Impresora fisica: ${res.mensaje}`, variant: "default" });
        }
        sessionStorage.removeItem("pedidoActualId");
        sessionStorage.removeItem("pedidoActualItems");
      } catch (e: any) {
        toast({ title: "Error al actualizar pedido", description: e?.message ?? "Intente nuevamente", variant: "destructive" });
      } finally {
        setActualizandoPedido(false);
      }
      return;
    }

    // Nuevo pedido
    crearPedidoMutation.mutate(
      {
        data: {
          mesa: mesaNum,
          items: itemsPayload,
          total: totalCarrito,
          notas: notasGenerales.trim() || undefined,
          meseroId: usuario?.id,
        },
      },
      {
        onSuccess: async (pedido) => {
          actualizarMesaMutation.mutate({
            numero: mesaNum,
            data: { estado: "ocupada", personas: personasStr ? parseInt(personasStr) : 1 },
          });
          queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
          setConfirmado({ id: pedido.id });
          setShowAnim(true);
          // Imprimir ventana web
          imprimirComanda(pedido.id);
          // Imprimir fisico via puente local o USB
          const ticket = buildComandaText(pedido.id);
          const res = await localPrinter.print(ticket);
          if (!res.ok) {
            toast({ title: "Comanda web OK", description: `Impresora fisica: ${res.mensaje}`, variant: "default" });
          }
        },
        onError: () => {
          toast({ title: "Error al enviar pedido", description: "Intente nuevamente", variant: "destructive" });
        },
      },
    );
  };

  if (confirmado) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-8 p-8 relative overflow-hidden">
        <OrderConfirmAnimation
          open={showAnim}
          message="¡Pedido Enviado!"
          submessage={`Mesa ${mesaNum} · #${confirmado.id}`}
          durationMs={2200}
          onComplete={() => setShowAnim(false)}
        />
        <div className="text-center animate-in fade-in zoom-in-50 duration-500">
          <div className="text-7xl mb-4">✅</div>
          <h2 className="text-3xl font-black text-white mb-2">¡Pedido Enviado!</h2>
          <p className="text-zinc-400">Mesa {mesaNum}</p>
        </div>
        <div
          className="rounded-3xl p-8 text-center border"
          style={{ background: "rgba(255,45,45,0.08)", borderColor: "rgba(255,45,45,0.2)" }}
        >
          <p className="text-zinc-500 text-sm mb-2 uppercase tracking-widest">Número de Turno</p>
          <div className="text-8xl font-black tracking-tighter" style={{ color: "#FF2D2D" }}>
            #{String(confirmado.id).padStart(4, "0")}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button variant="outline" className="border-white/10" onClick={() => imprimirComanda(confirmado.id)}>
            Reimprimir Comanda
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => setLocation("/")}>
            Volver a Mesas
          </Button>
        </div>

        {/* Opciones de impresion - PC vs Celular */}
        <div className="w-full max-w-sm rounded-2xl border border-white/5 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Imprimir comanda en...</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => imprimirComanda(confirmado.id)} className="px-3 py-2 rounded-xl border border-white/10 bg-white/3 text-xs font-bold text-zinc-300 hover:bg-white/5 flex flex-col items-center gap-1">
              <span className="text-lg">🖨️</span>
              <span>Impresora PC</span>
              <span className="text-[10px] text-zinc-600">Ctrl+P / WebUSB</span>
            </button>
            <button onClick={() => shareComanda(confirmado.id)} className="px-3 py-2 rounded-xl border border-white/10 bg-white/3 text-xs font-bold text-zinc-300 hover:bg-white/5 flex flex-col items-center gap-1">
              <span className="text-lg">📱</span>
              <span>Compartir / Celular</span>
              <span className="text-[10px] text-zinc-600">WhatsApp / PDF</span>
            </button>
          </div>

          {/* Boton fisico local */}
          <button
            onClick={async () => {
              const ticket = buildComandaText(confirmado.id);
              const res = await localPrinter.print(ticket);
              if (res.ok) {
                toast({ title: "Comanda impresa", description: res.mensaje });
              } else {
                toast({ title: "No se pudo imprimir", description: res.mensaje, variant: "destructive" });
              }
            }}
            disabled={localPrinter.state.isPrinting}
            className="w-full px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-2"
          >
            {localPrinter.state.isPrinting ? (
              <div className="w-3.5 h-3.5 animate-spin rounded-full border border-emerald-400/30 border-t-emerald-400" />
            ) : (
              <Usb className="w-3.5 h-3.5" />
            )}
            {localPrinter.state.isPrinting ? "Enviando..." : "Imprimir en Impresora Fisica (USB/Red)"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-white/5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
          sessionStorage.removeItem("pedidoActualId");
          sessionStorage.removeItem("pedidoActualItems");
          setLocation("/");
        }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={18} className="text-zinc-400" />
          </button>
          <div>
            <span className="font-bold text-white">Mesa {mesaNum}</span>
            {pedidoActualId ? (
              <span className="text-amber-400 text-sm ml-2 font-bold">· Editando Pedido #{String(pedidoActualId).padStart(4, "0")}</span>
            ) : (
              <span className="text-zinc-600 text-sm ml-2">· Nuevo Pedido</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="lg:hidden relative flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{ background: "rgba(255,45,45,0.08)", borderColor: "rgba(255,45,45,0.2)" }}
        >
          <ShoppingCart size={16} className="text-red-400" />
          {cantidadCarrito > 0 && (
            <span className="text-red-400 font-bold text-sm">{cantidadCarrito}</span>
          )}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="px-4 pt-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
            {MENU_CATEGORIAS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  categoriaActiva === cat.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "bg-white/5 text-zinc-400 hover:bg-white/8 hover:text-white border border-white/5"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-600 gap-2">
                <AlertCircle size={32} />
                <p>No hay productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
                {productosFiltrados.map((producto) => {
                  const enCarrito = cart.find((i) => i.productoId === producto.id);
                  const gradBg = CATEGORIA_COLORS[producto.categoria] || "from-zinc-800/50 to-zinc-900/50";
                  const borderCls = CATEGORIA_ACCENT[producto.categoria] || "border-white/10";

                  return (
                    <button
                      key={producto.id}
                      onClick={() => abrirModal(producto as ProductoModal)}
                      className={`group relative rounded-2xl p-4 text-left border transition-all duration-300 overflow-hidden cursor-pointer ${borderCls} ${enCarrito ? "ring-2 ring-red-500/40" : ""}`}
                      style={{
                        background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradBg} opacity-60 group-hover:opacity-100 transition-opacity`} />

                      {producto.destacado && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Star size={10} className="text-white fill-white" />
                        </div>
                      )}
                      {enCarrito && (
                        <div className="absolute top-2 left-2 z-10 min-w-5 h-5 px-1 rounded-full bg-red-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{enCarrito.cantidad}</span>
                        </div>
                      )}

                      <div className="relative z-10 mb-3">
                        {(producto as any).imagenUrl ? (
                          <div className="w-full h-24 -mx-4 -mt-4 mb-0 overflow-hidden rounded-t-2xl">
                            <img
                              src={(producto as any).imagenUrl}
                              alt={producto.nombre}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        ) : (
                          <div
                            className="text-5xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                            style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }}
                          >
                            {producto.emoji}
                          </div>
                        )}
                      </div>

                      <div className="relative z-10">
                        <p className="font-bold text-white text-sm leading-tight mb-1">{producto.nombre}</p>
                        {producto.descripcion && (
                          <p className="text-zinc-500 text-xs leading-snug line-clamp-2 mb-2">{producto.descripcion}</p>
                        )}
                        <p className="font-black text-base" style={{ color: "#FF2D2D" }}>
                          {formatPrice(producto.precio)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Cart */}
        {showCart && (
          <div
            className="w-96 flex-shrink-0 border-l border-white/5 flex flex-col"
            style={{
              background: "linear-gradient(180deg,rgba(13,13,16,0.98) 0%,rgba(8,8,10,1) 100%)",
              boxShadow: "inset 8px 0 24px rgba(255,45,45,0.04)",
            }}
          >
            <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-red-400" />
                <span className="font-bold text-white">Pedido</span>
                {cantidadCarrito > 0 && (
                  <span
                    key={cantidadCarrito}
                    className="px-2 py-0.5 rounded-full text-white text-xs font-bold badge-pop"
                    style={{
                      background: "linear-gradient(135deg,#FF2D2D,#CC0000)",
                      boxShadow: "0 4px 12px rgba(255,45,45,0.4)",
                    }}
                  >
                    {cantidadCarrito}
                  </span>
                )}
              </div>
              <button className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5" onClick={() => setShowCart(false)}>
                <X size={16} className="text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-zinc-600 gap-2">
                  <ShoppingCart size={28} />
                  <p className="text-sm">Carrito vacío</p>
                  <p className="text-xs">Selecciona productos del menú</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-3 border cart-item-enter group hover:border-red-500/30 transition-all"
                    style={{
                      background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.015) 100%)",
                      borderColor: "rgba(255,255,255,0.07)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{item.nombre}</p>
                        {item.observaciones && (
                          <p className="text-amber-400/80 text-xs mt-0.5 italic">* {item.observaciones}</p>
                        )}
                        <p className="text-red-400 text-xs font-bold mt-1">{formatPrice(item.precio * item.cantidad)}</p>
                      </div>
                      <button onClick={() => eliminarItem(item.id)} className="w-6 h-6 flex items-center justify-center hover:text-red-400 text-zinc-600 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => actualizarCantidad(item.id, -1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Minus size={12} className="text-zinc-400" />
                      </button>
                      <span className="text-white font-bold text-sm w-6 text-center">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, 1)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Plus size={12} className="text-zinc-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-4 pb-2">
                <Textarea
                  placeholder="Notas del pedido..."
                  value={notasGenerales}
                  onChange={(e) => setNotasGenerales(e.target.value)}
                  className="resize-none text-xs h-16 bg-white/3 border-white/8 text-zinc-300 placeholder:text-zinc-700"
                />
              </div>
            )}

            <div className="p-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Total</span>
                <span className="text-white font-black text-xl">{formatPrice(totalCarrito)}</span>
              </div>
              <Button
                className="w-full h-12 font-bold text-base rounded-xl"
                style={{
                  background: cart.length === 0 ? undefined : "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
                  boxShadow: cart.length > 0 ? "0 8px 32px rgba(255,45,45,0.3)" : undefined,
                }}
                disabled={cart.length === 0 || crearPedidoMutation.isPending || actualizandoPedido}
                onClick={handleConfirmar}
              >
                {actualizandoPedido || crearPedidoMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {pedidoActualId ? "Actualizando..." : "Enviando..."}
                  </span>
                ) : (
                  `${pedidoActualId ? "Actualizar Pedido" : "Confirmar"} · ${formatPrice(totalCarrito)}`
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {modalProducto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div
            className="w-full max-w-md rounded-3xl border overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className={`relative overflow-hidden ${modalProducto.imagenUrl ? "" : `p-6 bg-gradient-to-br ${CATEGORIA_COLORS[modalProducto.categoria] || ""}`}`}>
              <button onClick={cerrarModal} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                <X size={16} className="text-white" />
              </button>
              {modalProducto.imagenUrl ? (
                <div className="relative h-44 w-full">
                  <img src={modalProducto.imagenUrl} alt={modalProducto.nombre} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-black text-white drop-shadow-lg">{modalProducto.nombre}</h3>
                          {modalProducto.destacado && <Star size={14} className="text-amber-400 fill-amber-400" />}
                        </div>
                        {modalProducto.descripcion && (
                          <p className="text-zinc-300 text-xs leading-relaxed drop-shadow">{modalProducto.descripcion}</p>
                        )}
                      </div>
                      <p className="text-2xl font-black ml-3 shrink-0" style={{ color: "#FF6B6B", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                        {formatPrice(modalProducto.precio)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-7xl mb-3" style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.6))" }}>
                    {modalProducto.emoji}
                  </div>
                </div>
              )}
              {!modalProducto.imagenUrl && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-black text-white">{modalProducto.nombre}</h3>
                    {modalProducto.destacado && <Star size={14} className="text-amber-400 fill-amber-400" />}
                  </div>
                  {modalProducto.descripcion && (
                    <p className="text-zinc-400 text-sm leading-relaxed">{modalProducto.descripcion}</p>
                  )}
                  <p className="text-2xl font-black mt-3" style={{ color: "#FF2D2D" }}>
                    {formatPrice(modalProducto.precio)}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Cantidad</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setModalCantidad((q) => Math.max(1, q - 1))} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Minus size={18} className="text-zinc-400" />
                  </button>
                  <span className="text-3xl font-black text-white w-10 text-center">{modalCantidad}</span>
                  <button onClick={() => setModalCantidad((q) => q + 1)} className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center hover:bg-red-600/30 transition-colors">
                    <Plus size={18} className="text-red-400" />
                  </button>
                  <div className="ml-auto">
                    <span className="text-xl font-black text-white">{formatPrice(modalProducto.precio * modalCantidad)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Observaciones (opcional)</label>
                <Textarea
                  placeholder="Ej: Sin cebolla, extra queso, término al punto..."
                  value={modalObs}
                  onChange={(e) => setModalObs(e.target.value)}
                  className="resize-none h-20 bg-white/5 border-white/10 text-white placeholder:text-zinc-700 rounded-xl focus:border-red-500/40"
                  maxLength={200}
                />
                {modalObs && (
                  <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={10} />
                    Las observaciones se muestran al cocinero
                  </p>
                )}
              </div>

              <Button
                className="w-full h-12 font-bold rounded-xl text-base"
                onClick={agregarAlCarrito}
                style={{
                  background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
                  boxShadow: "0 8px 32px rgba(255,45,45,0.3)",
                }}
              >
                <ShoppingCart size={18} className="mr-2" />
                Agregar · {formatPrice(modalProducto.precio * modalCantidad)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
