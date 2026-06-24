import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import {
  usuariosTable,
  productosTable,
  mesasTable,
  cajaSesionesTable,
  pedidosTable,
} from "./schema";

const usuariosSeed = [
  { nombre: "Fernando", usuario: "fernando", contrasena: "0624", rol: "admin" as const },
  { nombre: "Ingrid", usuario: "ingrid", contrasena: "1234", rol: "mesero" as const },
  { nombre: "Zaira", usuario: "zaira", contrasena: "1234", rol: "mesero" as const },
  { nombre: "Caja", usuario: "caja", contrasena: "caja", rol: "caja" as const },
  { nombre: "Cocina", usuario: "cocina", contrasena: "1234", rol: "cocinero" as const },
];

export async function seedUsuarios() {
  console.log("[seed] Usuarios...");
  for (const u of usuariosSeed) {
    const existentes = await db.select({ id: usuariosTable.id }).from(usuariosTable).where(eq(usuariosTable.usuario, u.usuario));
    const hash = await bcrypt.hash(u.contrasena, 10);
    if (existentes.length > 0) {
      await db.update(usuariosTable).set({ contrasenaHash: hash, nombre: u.nombre, rol: u.rol, activo: true }).where(eq(usuariosTable.usuario, u.usuario));
      console.log(`  -> ${u.usuario} actualizado`);
    } else {
      await db.insert(usuariosTable).values({ nombre: u.nombre, usuario: u.usuario, contrasenaHash: hash, rol: u.rol, activo: true });
      console.log(`  -> ${u.usuario} creado`);
    }
  }
}

const productosSeed = [
  // Hamburguesas
  { nombre: "Sencilla", descripcion: "Pan brioche, vegetales, arepa, carne de res, tocineta, queso, papas a la francesa", precio: 17000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: false, posicion: 1, imagenUrl: "/images/burger.png" },
  { nombre: "Mixta", descripcion: "Pan brioche, vegetales, arepa, carne de res, pollo desmechado o filete, papas a la francesa, queso", precio: 24000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 2, imagenUrl: "" },
  { nombre: "Ranchera", descripcion: "Pan brioche, vegetales, arepa, carne de res, carne desmechada en salsa de la casa, chorizo, papas a la francesa, queso", precio: 27000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: false, posicion: 3, imagenUrl: "" },
  { nombre: "Campesina", descripcion: "Pan brioche, vegetales, arepa, carne de res, pollo desmechado en maiz con salsa de la casa, huevo frito, chorizo, papas a la francesa, queso", precio: 30000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 4, imagenUrl: "" },
  { nombre: "Doble Carne", descripcion: "Pan brioche, vegetales, arepa, doble carne de res, doble tocineta, papas a la francesa, queso", precio: 27500, emoji: "🍔", categoria: "burgers", disponible: true, destacado: false, posicion: 5, imagenUrl: "" },
  { nombre: "Doble Mixta", descripcion: "Pan brioche, vegetales, arepa, doble carne de res, pollo desmechado en salsa de la casa o filete, tocineta, papas a la francesa, queso", precio: 33000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 6, imagenUrl: "" },
  { nombre: "Tiamo", descripcion: "Pan brioche, vegetales, arepa, carne de res, tocineta, pollo desmechado o filete, chorizo, carne desmechada en salsa de la casa, papas a la francesa, queso", precio: 34000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 7, imagenUrl: "" },
  { nombre: "Tiamo Apanada", descripcion: "Pan brioche, carne de res, tocineta, pollo apanado con salsa fuego dulce, papas a la francesa con taza de queso cheddar", precio: 45000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 8, imagenUrl: "" },

  // Perros
  { nombre: "Perro Sencillo", descripcion: "Pan brioche, salchicha americana, fosforito, queso gratinado, huevo de codorniz, papas a la francesa, queso", precio: 16000, emoji: "🌭", categoria: "perros", disponible: true, destacado: false, posicion: 9, imagenUrl: "/images/perro.png" },
  { nombre: "Perro Mixto", descripcion: "Pan brioche, salchicha americana, pollo desmechado con maiz en salsa de la casa, fosforito, queso gratinado, tocineta caramelo, huevo codorniz, papas a la francesa, queso", precio: 20000, emoji: "🌭", categoria: "perros", disponible: true, destacado: true, posicion: 10, imagenUrl: "" },
  { nombre: "Perro Tiamo", descripcion: "Pan brioche, cebolla, salchicha americana, pollo y carne desmechada, fosforito, queso gratinado, tocineta caramelo, huevo codorniz, papas a la francesa, queso", precio: 27000, emoji: "🌭", categoria: "perros", disponible: true, destacado: true, posicion: 11, imagenUrl: "" },
  { nombre: "Perro Endiablado", descripcion: "Pan brioche, cebolla, salchicha americana, carne desmechada, jalapeños, maíz, queso gratinado, tocineta caramelo, huevo codorniz, papas a la francesa, queso", precio: 25000, emoji: "🌭", categoria: "perros", disponible: true, destacado: false, posicion: 12, imagenUrl: "" },

  // Papas
  { nombre: "Salchipapa", descripcion: "Papas a la francesa, salchicha, queso rallado", precio: 17000, emoji: "🍟", categoria: "papas", disponible: true, destacado: false, posicion: 13, imagenUrl: "/images/papas.png" },
  { nombre: "Choripapa", descripcion: "Papas a la francesa, chorizo, queso rallado", precio: 19000, emoji: "🍟", categoria: "papas", disponible: true, destacado: false, posicion: 14, imagenUrl: "" },
  { nombre: "Papas Locas", descripcion: "Papas a la francesa, salchicha, filete de pechuga al carbon, maíz, queso rallado, tocineta caramelo", precio: 31000, emoji: "🍟", categoria: "papas", disponible: true, destacado: true, posicion: 15, imagenUrl: "" },
  { nombre: "Picada", descripcion: "Papas a la francesa, salchicha, pechuga y chuleta al carbon, maiz, lechuga, salsa de la casa, queso rallado, tocineta caramelo", precio: 40000, emoji: "🍟", categoria: "papas", disponible: true, destacado: true, posicion: 16, imagenUrl: "" },
  { nombre: "Desgrado Especial", descripcion: "Papas a la francesa, salchicha, carne burguer, pollo desmechado en salsa de la casa, maíz, queso gratinado, tocineta caramelo", precio: 34000, emoji: "🍟", categoria: "papas", disponible: true, destacado: false, posicion: 17, imagenUrl: "" },

  // Pizzetas
  { nombre: "Pizeta Pollo Champiñon", descripcion: "Salsa, pollo, champiñones, mozarella", precio: 24000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 18, imagenUrl: "/images/pizza.png" },
  { nombre: "Pizeta Hawaiana", descripcion: "Salsa, piña, tocineta, mozarella", precio: 21000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: true, posicion: 19, imagenUrl: "" },
  { nombre: "Pizeta Campesina", descripcion: "Salsa, carne, maiz, tocineta, mozarella", precio: 27000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 20, imagenUrl: "" },
  { nombre: "Pizeta Peperoni", descripcion: "Queso mozarella, peperoni, albahaca", precio: 23000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 21, imagenUrl: "" },
  { nombre: "Pizeta Vegetariana", descripcion: "Salsa, champiñones, pimenton, cebolla, maiz, mozarella", precio: 22000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 22, imagenUrl: "" },
  { nombre: "Pizeta Tiamo", descripcion: "Salsa, pollo, carne, cabano, chorizo, tocineta, verduras, mozarella", precio: 30000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: true, posicion: 23, imagenUrl: "" },
  { nombre: "Pizeta Ranchera", descripcion: "Salsa, carne, chorizo, tocineta, cabano, maiz, mozarella", precio: 28000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 24, imagenUrl: "" },
  { nombre: "Pizeta Mexicana", descripcion: "Salsa, carne, chorizo, maiz, jalapeños, mozarella", precio: 25000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 25, imagenUrl: "" },

  // Panzerotis
  { nombre: "Panzeroti Pollo Champiñon", descripcion: "Salsa, pollo, champiñones, mozarella", precio: 27000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 26, imagenUrl: "/images/panzerotti.png" },
  { nombre: "Panzeroti Hawaiana", descripcion: "Salsa, piña, tocineta, mozarella", precio: 24000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 27, imagenUrl: "" },
  { nombre: "Panzeroti Campesina", descripcion: "Salsa, carne, maiz, tocineta, mozarella", precio: 29000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: true, posicion: 28, imagenUrl: "" },
  { nombre: "Panzeroti Peperoni", descripcion: "Salsa, peperoni, queso mozarella, albahaca", precio: 25000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 29, imagenUrl: "" },
  { nombre: "Panzeroti Vegetariana", descripcion: "Salsa, champiñones, pimenton, cebolla, maiz, mozarella", precio: 24000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 30, imagenUrl: "" },
  { nombre: "Panzeroti Tiamo", descripcion: "Salsa, pollo desmechado, carne, cabano, chorizo, tocineta, verduras, mozarella", precio: 33000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: true, posicion: 31, imagenUrl: "" },
  { nombre: "Panzeroti Ranchera", descripcion: "Salsa, carne, chorizo, tocineta, cabano, maiz, mozarella", precio: 30000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 32, imagenUrl: "" },
  { nombre: "Panzeroti Mexicana", descripcion: "Salsa, carne, chorizo, maiz, jalapeños, mozarella", precio: 29000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 33, imagenUrl: "" },

  // Adicionales
  { nombre: "Adic. Papas a la Francesa", descripcion: "1 porción adicional de papas a la francesa", precio: 8000, emoji: "🍟", categoria: "adicionales", disponible: true, destacado: false, posicion: 34, imagenUrl: "/images/adicionales.png" },
  { nombre: "Adic. Queso Mozarella", descripcion: "Porción extra de queso mozarella", precio: 9000, emoji: "🧀", categoria: "adicionales", disponible: true, destacado: false, posicion: 35, imagenUrl: "" },
  { nombre: "Adic. Pollo Desmechado", descripcion: "Porción extra de pollo desmechado", precio: 6000, emoji: "🍗", categoria: "adicionales", disponible: true, destacado: false, posicion: 36, imagenUrl: "" },
  { nombre: "Adic. Carne Desmechada", descripcion: "Porción extra de carne desmechada", precio: 7000, emoji: "🥩", categoria: "adicionales", disponible: true, destacado: false, posicion: 37, imagenUrl: "" },
  { nombre: "Adic. Maíz", descripcion: "Porción extra de maíz", precio: 3000, emoji: "🌽", categoria: "adicionales", disponible: true, destacado: false, posicion: 38, imagenUrl: "" },
  { nombre: "Adic. Carnes Frías", descripcion: "Porción extra de carnes frías", precio: 4000, emoji: "🥩", categoria: "adicionales", disponible: true, destacado: false, posicion: 39, imagenUrl: "" },
  { nombre: "Adic. Carne Burguer", descripcion: "Porción extra de carne de hamburguesa", precio: 6000, emoji: "🍔", categoria: "adicionales", disponible: true, destacado: false, posicion: 40, imagenUrl: "" },

  // Bebidas
  { nombre: "Gaseosa Postobon 1.5L", descripcion: "Gaseosa Postobón de 1.5 litros", precio: 7500, emoji: "🥤", categoria: "bebidas", disponible: true, destacado: false, posicion: 41, imagenUrl: "/images/bebidas.png" },
  { nombre: "Postobon Pet 500ml", descripcion: "Gaseosa Postobón pet 500ml", precio: 4500, emoji: "🥤", categoria: "bebidas", disponible: true, destacado: false, posicion: 42, imagenUrl: "" },
  { nombre: "Agua", descripcion: "Agua mineral 600ml", precio: 3000, emoji: "💧", categoria: "bebidas", disponible: true, destacado: false, posicion: 43, imagenUrl: "" },
  { nombre: "Jugo Hit 1.5L", descripcion: "Jugo Hit de 1.5 litros", precio: 7500, emoji: "🧃", categoria: "bebidas", disponible: true, destacado: false, posicion: 44, imagenUrl: "" },
  { nombre: "Coca-Cola Pet 400ml", descripcion: "Coca-Cola pet 400ml", precio: 5000, emoji: "🥤", categoria: "bebidas", disponible: true, destacado: true, posicion: 45, imagenUrl: "" },

  // Granizadas
  { nombre: "Granizada Mandarina", descripcion: "Granizada refrescante sabor mandarina", precio: 11000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: true, posicion: 46, imagenUrl: "/images/granizada.png" },
  { nombre: "Granizada Naranja", descripcion: "Granizada refrescante sabor naranja", precio: 11000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: false, posicion: 47, imagenUrl: "" },
  { nombre: "Granizada Limón", descripcion: "Granizada refrescante sabor limón", precio: 8000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: false, posicion: 48, imagenUrl: "" },
  { nombre: "Granizada Tamarindo", descripcion: "Granizada refrescante sabor tamarindo", precio: 10000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: false, posicion: 49, imagenUrl: "" },
  { nombre: "Granizada Hierbabuena", descripcion: "Granizada refrescante sabor hierbabuena", precio: 11000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: true, posicion: 50, imagenUrl: "" },
];

export async function seedProductos() {
  console.log("[seed] Productos...");
  const existentes = await db.select({ id: productosTable.id }).from(productosTable);
  if (existentes.length === 0) {
    await db.insert(productosTable).values(productosSeed);
    console.log(`  -> ${productosSeed.length} productos insertados`);
  } else {
    console.log(`  -> ${existentes.length} productos existen, actualizando imagenes...`);
    for (const p of productosSeed) {
      await db.update(productosTable)
        .set({ imagenUrl: p.imagenUrl || null })
        .where(eq(productosTable.nombre, p.nombre));
    }
    console.log(`  -> ${productosSeed.length} productos actualizados`);
  }
}

export async function seedMesasYCaja() {
  console.log("[seed] Mesas y caja...");
  const mesasExistentes = await db.select({ numero: mesasTable.numero }).from(mesasTable);
  const mesasNumeros = new Set(mesasExistentes.map((m) => m.numero));
  const mesasNombres = [
    { numero: "01", nombre: "Terraza 1" },
    { numero: "02", nombre: "Terraza 2" },
    { numero: "03", nombre: "Salón 1" },
    { numero: "04", nombre: "Salón 2" },
    { numero: "05", nombre: "Bar A" },
    { numero: "06", nombre: "Bar B" },
    { numero: "07", nombre: "VIP 1" },
    { numero: "08", nombre: "VIP 2" },
    { numero: "09", nombre: "Jardín 1" },
    { numero: "10", nombre: "Jardín 2" },
    { numero: "T1", nombre: "Terraza Principal" },
    { numero: "B1", nombre: "Bar Central" },
  ];
  for (const m of mesasNombres) {
    if (!mesasNumeros.has(m.numero)) {
      await db.insert(mesasTable).values({
        numero: m.numero,
        nombre: m.nombre,
        estado: m.numero === "03" || m.numero === "07" ? "ocupada" : m.numero === "05" ? "en_pago" : "libre",
        personas: m.numero === "03" ? 4 : m.numero === "07" ? 2 : m.numero === "05" ? 6 : 0,
      });
      console.log(`  -> Mesa ${m.numero} creada`);
    }
  }

  const sesiones = await db.select({ id: cajaSesionesTable.id }).from(cajaSesionesTable).where(eq(cajaSesionesTable.estado, "abierta"));
  if (sesiones.length === 0) {
    await db.insert(cajaSesionesTable).values({
      usuarioId: 2, usuarioNombre: "Administrador Demo", montoInicial: 200000,
      totalEfectivo: 345000, totalTransferencia: 180000, totalPropinas: 25000,
      diferencia: 0, estado: "abierta", notas: "Fondo inicial de $200,000",
    });
    console.log("  -> Sesión de caja abierta creada");
  }

  const pedidosExistentes = await db.select({ id: pedidosTable.id }).from(pedidosTable);
  if (pedidosExistentes.length === 0) {
    const pedidosDemo = [
      { mesa: 3, items: [{ id: "1", nombre: "Tiamo Classic", emoji: "🍔", precio: 18000, cantidad: 2, observaciones: "" }, { id: "8", nombre: "Papas Premium", emoji: "🍟", precio: 9000, cantidad: 1 }], estado: "nuevo" as const, total: 45000, meseroId: 4, metodoPago: "pendiente" as const, pagos: [], propina: 0 },
      { mesa: 7, items: [{ id: "2", nombre: "Double Tiamo", emoji: "🍔", precio: 24000, cantidad: 1 }], estado: "preparando" as const, total: 24000, meseroId: 5, metodoPago: "pendiente" as const, pagos: [], propina: 0 },
      { mesa: 5, items: [{ id: "3", nombre: "BBQ Bacon", emoji: "🥓", precio: 22000, cantidad: 3, observaciones: "Sin cebolla" }, { id: "10", nombre: "Malteada Vainilla", emoji: "🥤", precio: 14000, cantidad: 2 }], estado: "listo" as const, total: 94000, meseroId: 4, metodoPago: "efectivo" as const, pagos: [{ metodo: "efectivo", monto: 94000 }], propina: 3000 },
      { mesa: 1, items: [{ id: "1", nombre: "Tiamo Classic", emoji: "🍔", precio: 18000, cantidad: 1 }, { id: "8", nombre: "Papas Premium", emoji: "🍟", precio: 9000, cantidad: 1 }], estado: "cobrado" as const, total: 27000, meseroId: 4, metodoPago: "efectivo" as const, pagos: [{ metodo: "efectivo", monto: 27000 }], propina: 2000 },
      { mesa: 2, items: [{ id: "2", nombre: "Double Tiamo", emoji: "🍔", precio: 24000, cantidad: 1 }, { id: "9", nombre: "Nuggets x8", emoji: "🍗", precio: 12000, cantidad: 1 }], estado: "cobrado" as const, total: 36000, meseroId: 5, metodoPago: "mixto" as const, pagos: [{ metodo: "efectivo", monto: 16000 }, { metodo: "transferencia", monto: 20000 }], propina: 1000 },
    ];
    for (const p of pedidosDemo) {
      await db.insert(pedidosTable).values(p as any);
    }
    console.log(`  -> ${pedidosDemo.length} pedidos demo creados`);
  }
}

export async function seedAll() {
  try {
    await seedUsuarios();
    await seedProductos();
    await seedMesasYCaja();
    console.log("[seed] ✅ Todo listo");
  } catch (e) {
    console.error("[seed] ❌ Error:", e);
  }
}
