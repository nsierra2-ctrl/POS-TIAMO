# TIAMO BURGER — Sistema POS

## Descripción

Sistema POS (Point of Sale) completo para TIAMO BURGER. Full-stack monorepo con React+Vite frontend, Express 5 backend y PostgreSQL. Incluye flujo de cobro (efectivo/transferencia/mixto/split), control de caja, cocina KDS, impresora simulada y analíticas avanzadas.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend**: Express 5 + TypeScript
- **Base de datos**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + cookie-parser)
- **Codegen API**: Orval (OpenAPI → React Query hooks, Zod schemas)
- **Tiempo real**: SSE (Server-Sent Events) en `/api/eventos`
- **Charts**: Recharts (BarChart, PieChart)

## Estructura

```
artifacts/
├── api-server/         # Backend Express 5
└── ventura-pos/        # Frontend React+Vite

lib/
├── api-spec/           # OpenAPI spec v4.0.0
├── api-client-react/   # Hooks generados (Orval)
├── api-zod/            # Schemas Zod generados
└── db/                 # Drizzle schema + conexión DB
```

## Páginas del sistema

### Roles: admin, mesero, cocinero, caja

- `/login` — Login con TIAMO BURGER branding, botones de credenciales demo
- `/` — Mapa de mesas (mesero/admin) — estado en tiempo real, modal de acciones (nuevo pedido / cobrar)
- `/pedido` — Toma de pedido: categorías → modal cantidad/observaciones → carrito flotante → confirmar
- `/cocina` — Kitchen Display System: tarjetas por estado (nuevo/preparando/listo), timer de espera, filtros por estado, alertas de voz, fullscreen
- `/dashboard` — Analíticas: KPIs ventas, efectivo/transferencia (PieChart), ventas por mesero, gráfico 7 días stacked, top productos, últimos pedidos
- `/caja` — Control de caja: apertura con fondo inicial, cierre con arqueo, resumen del día, historial de sesiones
- `/admin/productos` — CMS: CRUD completo de productos
- `/admin/mesas` — Gestión de mesas
- `/admin/impresora` — Configuración de impresora (simulado/real), logs, vista previa de ticket
- `/usuarios` — Gestión de personal (admin)
- `/turnos` — Display público de turnos (TV, sin auth)

## Base de datos (tablas)

- `mesas` — Estado de mesas (libre/ocupada/proceso, personas)
- `pedidos` — Pedidos con items (jsonb), estado, metodoPago, pagos (jsonb), propina, cobradoEn, cobradoPor, historialEstados (jsonb)
- `usuarios` — Personal con rol y contraseña hasheada (bcrypt). Roles: admin, mesero, cocinero, caja
- `productos` — Catálogo: nombre, emoji, precio, categoría, disponible, destacado, imagenUrl
- `caja_sesiones` — Sesiones de apertura/cierre de caja con totales y diferencia

## Credenciales

### Producción (owner)
- **Carlos Tiamo** (super admin): `carlos.tiamo` / `Tiamo2026!` — desde aquí se crean los demás usuarios de producción

### Demo / Seed actual
- **Admin**: `fernando` / `0624`
- **Mesero**: `ingrid` / `1234`
- **Mesero 2**: `zaira` / `1234`
- **Cocina**: `cocina` / `1234`
- **Caja**: `caja` / `caja`

## Impresora Física (JAL-P58 / TM-T20)

### Para imprimir comandas y facturas en tu impresora térmica:

1. **Descargar `bridge.js`** en tu laptop (está en la raíz del proyecto)
2. **Editar la IP** de tu impresora en `bridge.js` (por defecto: `192.168.1.100:9100`)
3. **Correr el puente**:
   ```bash
   node bridge.js
   ```
4. El frontend detecta automáticamente el puente en `localhost:3001`

### ¿Qué hace el puente?
- Recibe tickets HTTP del frontend (Replit en la nube)
- Los convierte a ESC/POS (comandos binarios para impresora térmica)
- Los envía por TCP a tu impresora en la red local

### Flujo de impresión:
- **Al hacer pedido** (confirmar en mesa) → Comanda se imprime automáticamente en cocina
- **Al cobrar** (cobrar mesa) → Factura se imprime automáticamente en caja
- También hay botones manuales: "Reimprimir Comanda" y "Imprimir Factura"

## Flujo de cobro (CobrarModal)

1. Mesero hace clic en mesa ocupada → modal de acciones
2. Si hay pedido activo → botón "Cobrar Mesa" → abre CobrarModal
3. CobrarModal: seleccionar propina (0/5/10/15% o manual) → método de pago (efectivo/transferencia/mixto) → calcular cambio → confirmar
4. POST `/api/pedidos/:id/cobrar` → estado pasa a "cobrado" → historialEstados actualizado → mesa liberada

## Control de caja

- Apertura: define fondo inicial (efectivo en caja al abrir)
- Cierre: cuenta el efectivo físico → sistema calcula diferencia con total esperado (ventas efectivo + fondo inicial)
- Resumen del día: totales por método de pago, propinas, pedidos cobrados
- Historial de sesiones con diferencia (sobrante/faltante)

## Variables de entorno requeridas

- `DATABASE_URL` — Conexión PostgreSQL
- `SESSION_SECRET` — Secreto JWT

## Comandos útiles

```bash
# Push schema DB
pnpm --filter @workspace/db run push-force

# Seed productos TIAMO BURGER
pnpm --filter @workspace/db run tsx src/seed-productos.ts

# Regenerar hooks de API
pnpm --filter @workspace/api-spec run codegen

# Rebuild libs TypeScript
pnpm run typecheck:libs

# Typecheck full
pnpm run typecheck
```

## Categorías del menú (50 productos)

1. **Hamburguesas** 🍔 — Sencilla, Mixta, Ranchera, Campesina, Doble Carne, Doble Mixta, Tiamo, Tiamo Apanada
2. **Perros Calientes** 🌭 — Sencillo, Mixto, Tiamo, Endiablado
3. **Papas** 🍟 — Salchipapa, Choripapa, Papas Locas, Picada, Desgrado Especial
4. **Pizzetas** 🍕 — Pollo Champiñon, Hawaiana, Campesina, Peperoni, Vegetariana, Tiamo, Ranchera, Mexicana
5. **Panzerotis** 🫖 — Pollo Champiñon, Hawaiana, Campesina, Peperoni, Vegetariana, Tiamo, Ranchera, Mexicana
6. **Adicionales** — Papas, Queso, Pollo, Carne, Maíz, Carnes frías, Carne burguer
7. **Bebidas** 🥤 — Gaseosa 1.5L, Postobon pet, Agua, Jugo Hit 1.5L, Coca 400ml
8. **Granizadas** 🧊 — Mandarina, Naranja, Limón, Tamarindo, Hierbabuena

## Features clave

1. **JWT Auth** — Cookie `token`, 4 roles: admin/mesero/cocinero/caja
2. **SSE Real-time** — `/api/eventos` con broadcast en mutaciones
3. **Cobro completo** — Efectivo / Transferencia / Mixto / Propinas / Split
4. **Caja** — Apertura con fondo, cierre con arqueo, diferencia calculada
5. **KDS** — Kitchen Display con timer de espera, colores por urgencia, fullscreen
6. **Impresora simulada** — Logs de tickets, modo real/simulado, vista previa
7. **Analytics** — PieChart efectivo vs transferencia, barras por mesero, stacked bars 7 días
8. **Historial de estados** — Cada cambio de estado de pedido queda registrado con usuario y timestamp
9. **Factura HTML** — `/api/pedidos/:id/factura` — abre para imprimir/PDF
10. **Auto-limpieza cocina** — Pedidos "listo" se ocultan de pantalla en 30s

## Notas técnicas

- Fondo: `#070708`, acento: `#FF2D2D`
- Dark mode siempre activo, UI en español
- `zod` v3.x (drizzle-zod@0.7.0 compatible) — usar `from "zod"` no `"zod/v4"`
- `req.params.X as string` necesario por Express 5 tipos
- wouter Link v3 — no anidar `<a>` dentro de `<Link>`
- React Query v5 — hooks toman `{ query: { queryKey: getGetXQueryKey() } }`
- OpenAPI v4.0.0 — codegen con `pnpm --filter @workspace/api-spec run codegen`
- Después de codegen: `pnpm run typecheck:libs` para reconstruir declarations
- **Cookie JWT**: siempre `SameSite=None; Secure=true` (Replit HTTPS/iframe requiere esto para que el cobrar no falle con 401)
- **lib/api-zod/src/index.ts**: usar `export { SubirImagenBody } from "./generated/api"` al final para resolver TS2308 duplicate export
- **PremiumBackground**: componente fijo de fondo animado en `src/components/premium-background.tsx`; importar en todas las páginas
- **Foto de usuario**: campo `fotoUrl` en DB tabla `usuarios`; endpoint `PUT /api/usuarios/:id/foto`; la navigation.tsx permite subir foto clickeando el avatar
- **Export/WhatsApp**: usar `<RecordExportBar />` (en `src/components/record-export-bar.tsx`) en cualquier página admin; descarga CSV o envía resumen a WhatsApp. Número config en localStorage `tiamo:wa-number`. Utilidades en `src/lib/export-utils.ts`
- **Animación de pedido**: `<OrderConfirmAnimation open={...} />` (confeti + checkmark 3D + ring pulsante)
- **Iconos 3D**: clase `.icon-3d` con halo blur, hover tilt 3D; `.icon-float-idle` flota; `.caja-pulse-emerald` pulso verde para estado caja abierta
- **Modo Demo/Real**: toggle en login persistido en localStorage `tiamo:mode`; `PremiumBackground variant="food"` activa fondo cinematográfico con partículas y vapor
- **Tipografía**: Inter Variable (cuerpo) + Bricolage Grotesque (display, clase `.font-display`) + JetBrains Mono (código). Cargadas en `index.html`, vars en `--app-font-sans/-display/-mono`
- **Page transitions**: `<PageTransition>{(loc) => <Switch location={loc}>...</Switch>}</PageTransition>` en App.tsx — fade+slide+blur con respeto a `prefers-reduced-motion`
- **Glass system**: `.glass-card` (con borde luminoso degradado vía mask) y `.glass-button` (lift on hover). Para fondos animados de marca: `.brand-gradient-bg`
- **Componentes nuevos**: `<EmptyState variant="kitchen|tables|orders|cash|menu|users|search" title msg action />` con SVG ilustrado; `<Sparkline data />` para microcharts; `<Skeleton />`, `<SkeletonText lines />`, `<SkeletonCard />` para loading
- **Focus**: ring rojo accesible con offset (box-shadow), fallback `outline` en `forced-colors`
- **Nav shrink-on-scroll**: clase `nav-shrinkable` + `nav-scrolled` (h: 14→12, blur intensificado)
