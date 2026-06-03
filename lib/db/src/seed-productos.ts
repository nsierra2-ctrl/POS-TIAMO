import { db, productosTable } from "./index";

const productos = [
  // ===== HAMBURGUESAS =====
  { nombre: "Sencilla", descripcion: "Pan brioche, vegetales, arepa, carne de res, tocineta, queso, papas a la francesa, queso", precio: 17000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: false, posicion: 1 },
  { nombre: "Mixta", descripcion: "Pan brioche, vegetales, arepa, carne de res, pollo desmechado o filete, papas a la francesa, queso", precio: 24000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 2 },
  { nombre: "Ranchera", descripcion: "Pan brioche, vegetales, arepa, carne de res, carne desmechada en salsa de la casa, chorizo, papas a la francesa, queso", precio: 27000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: false, posicion: 3 },
  { nombre: "Campesina", descripcion: "Pan brioche, vegetales, arepa, carne de res, pollo desmechado en maiz con salsa de la casa, huevo frito, chorizo, papas a la francesa, queso", precio: 30000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 4 },
  { nombre: "Doble Carne", descripcion: "Pan brioche, vegetales, arepa, doble carne de res, doble tocineta, papas a la francesa, queso", precio: 27500, emoji: "🍔", categoria: "burgers", disponible: true, destacado: false, posicion: 5 },
  { nombre: "Doble Mixta", descripcion: "Pan brioche, vegetales, arepa, doble carne de res, pollo desmechado en salsa de la casa o filete, tocineta, papas a la francesa, queso", precio: 33000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 6 },
  { nombre: "Tiamo", descripcion: "Pan brioche, vegetales, arepa, carne de res, tocineta, pollo desmechado o filete, chorizo, carne desmechada en salsa de la casa, papas a la francesa, queso", precio: 34000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 7 },
  { nombre: "Tiamo Apanada", descripcion: "Pan brioche, carne de res, tocineta, pollo apanado con salsa fuego dulce, papas a la francesa con taza de queso cheddar", precio: 45000, emoji: "🍔", categoria: "burgers", disponible: true, destacado: true, posicion: 8 },

  // ===== PERROS CALIENTES =====
  { nombre: "Perro Sencillo", descripcion: "Pan brioche, salchicha americana, fosforito, queso gratinado, huevo de codorniz, papas a la francesa, queso", precio: 16000, emoji: "🌭", categoria: "perros", disponible: true, destacado: false, posicion: 9 },
  { nombre: "Perro Mixto", descripcion: "Pan brioche, salchicha americana, pollo desmechado con maiz en salsa de la casa, fosforito, queso gratinado, tocineta caramelo, huevo codorniz, papas a la francesa, queso", precio: 20000, emoji: "🌭", categoria: "perros", disponible: true, destacado: true, posicion: 10 },
  { nombre: "Perro Tiamo", descripcion: "Pan brioche, cebolla, salchicha americana, pollo y carne desmechada, fosforito, queso gratinado, tocineta caramelo, huevo codorniz, papas a la francesa, queso", precio: 27000, emoji: "🌭", categoria: "perros", disponible: true, destacado: true, posicion: 11 },
  { nombre: "Perro Endiablado", descripcion: "Pan brioche, cebolla, salchicha americana, carne desmechada, jalapeños, maíz, queso gratinado, tocineta caramelo, huevo codorniz, papas a la francesa, queso", precio: 25000, emoji: "🌭", categoria: "perros", disponible: true, destacado: false, posicion: 12 },

  // ===== PAPAS =====
  { nombre: "Salchipapa", descripcion: "Papas a la francesa, salchicha, queso rallado", precio: 17000, emoji: "🍟", categoria: "papas", disponible: true, destacado: false, posicion: 13 },
  { nombre: "Choripapa", descripcion: "Papas a la francesa, chorizo, queso rallado", precio: 19000, emoji: "🍟", categoria: "papas", disponible: true, destacado: false, posicion: 14 },
  { nombre: "Papas Locas", descripcion: "Papas a la francesa, salchicha, filete de pechuga al carbon, maíz, queso rallado, tocineta caramelo", precio: 31000, emoji: "🍟", categoria: "papas", disponible: true, destacado: true, posicion: 15 },
  { nombre: "Picada", descripcion: "Papas a la francesa, salchicha, pechuga y chuleta al carbon, maiz, lechuga, salsa de la casa, queso rallado, tocineta caramelo", precio: 40000, emoji: "🍟", categoria: "papas", disponible: true, destacado: true, posicion: 16 },
  { nombre: "Desgrado Especial", descripcion: "Papas a la francesa, salchicha, carne burguer, pollo desmechado en salsa de la casa, maíz, queso gratinado, tocineta caramelo", precio: 34000, emoji: "🍟", categoria: "papas", disponible: true, destacado: false, posicion: 17 },

  // ===== PIZZETAS =====
  { nombre: "Pizeta Pollo Champiñon", descripcion: "Salsa, pollo, champiñones, mozarella", precio: 24000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 18 },
  { nombre: "Pizeta Hawaiana", descripcion: "Salsa, piña, tocineta, mozarella", precio: 21000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: true, posicion: 19 },
  { nombre: "Pizeta Campesina", descripcion: "Salsa, carne, maiz, tocineta, mozarella", precio: 27000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 20 },
  { nombre: "Pizeta Peperoni", descripcion: "Queso mozarella, peperoni, queso mozarella, albahaca", precio: 23000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 21 },
  { nombre: "Pizeta Vegetariana", descripcion: "Salsa, champiñones, pimenton, cebolla, maiz, mozarella", precio: 22000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 22 },
  { nombre: "Pizeta Tiamo", descripcion: "Salsa, pollo, carne, cabano, chorizo, tocineta, verduras, mozarella", precio: 30000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: true, posicion: 23 },
  { nombre: "Pizeta Ranchera", descripcion: "Salsa, carne, chorizo, tocineta, cabano, maiz, mozarella", precio: 28000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 24 },
  { nombre: "Pizeta Mexicana", descripcion: "Salsa, carne, chorizo, maiz, jalapeños, mozarella", precio: 25000, emoji: "🍕", categoria: "pizzetas", disponible: true, destacado: false, posicion: 25 },

  // ===== PANZEROTIS =====
  { nombre: "Panzeroti Pollo Champiñon", descripcion: "Salsa, pollo, champiñones, mozarella", precio: 27000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 26 },
  { nombre: "Panzeroti Hawaiana", descripcion: "Salsa, piña, tocineta, mozarella", precio: 24000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 27 },
  { nombre: "Panzeroti Campesina", descripcion: "Salsa, carne, maiz, tocineta, mozarella", precio: 29000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: true, posicion: 28 },
  { nombre: "Panzeroti Peperoni", descripcion: "Salsa, peperoni, queso mozarella, albahaca", precio: 25000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 29 },
  { nombre: "Panzeroti Vegetariana", descripcion: "Salsa, champiñones, pimenton, cebolla, maiz, mozarella", precio: 24000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 30 },
  { nombre: "Panzeroti Tiamo", descripcion: "Salsa, pollo desmechado, carne, cabano, chorizo, tocineta, verduras, mozarella", precio: 33000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: true, posicion: 31 },
  { nombre: "Panzeroti Ranchera", descripcion: "Salsa, carne, chorizo, tocineta, cabano, maiz, mozarella", precio: 30000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 32 },
  { nombre: "Panzeroti Mexicana", descripcion: "Salsa, carne, chorizo, maiz, jalapeños, mozarella", precio: 29000, emoji: "🫖", categoria: "panzerotis", disponible: true, destacado: false, posicion: 33 },

  // ===== ADICIONALES =====
  { nombre: "Adic. Papas a la Francesa", descripcion: "1 porción adicional de papas a la francesa", precio: 8000, emoji: "🍟", categoria: "adicionales", disponible: true, destacado: false, posicion: 34 },
  { nombre: "Adic. Queso Mozarella", descripcion: "Porción extra de queso mozarella", precio: 9000, emoji: "🧀", categoria: "adicionales", disponible: true, destacado: false, posicion: 35 },
  { nombre: "Adic. Pollo Desmechado", descripcion: "Porción extra de pollo desmechado", precio: 6000, emoji: "🍗", categoria: "adicionales", disponible: true, destacado: false, posicion: 36 },
  { nombre: "Adic. Carne Desmechada", descripcion: "Porción extra de carne desmechada", precio: 7000, emoji: "🥩", categoria: "adicionales", disponible: true, destacado: false, posicion: 37 },
  { nombre: "Adic. Maíz", descripcion: "Porción extra de maíz", precio: 3000, emoji: "🌽", categoria: "adicionales", disponible: true, destacado: false, posicion: 38 },
  { nombre: "Adic. Carnes Frías", descripcion: "Porción extra de carnes frías", precio: 4000, emoji: "🥩", categoria: "adicionales", disponible: true, destacado: false, posicion: 39 },
  { nombre: "Adic. Carne Burguer", descripcion: "Porción extra de carne de hamburguesa", precio: 6000, emoji: "🍔", categoria: "adicionales", disponible: true, destacado: false, posicion: 40 },

  // ===== BEBIDAS =====
  { nombre: "Gaseosa Postobon 1.5L", descripcion: "Gaseosa Postobón de 1.5 litros", precio: 7500, emoji: "🥤", categoria: "bebidas", disponible: true, destacado: false, posicion: 41 },
  { nombre: "Postobon Pet 500ml", descripcion: "Gaseosa Postobón pet 500ml", precio: 4500, emoji: "🥤", categoria: "bebidas", disponible: true, destacado: false, posicion: 42 },
  { nombre: "Agua", descripcion: "Agua mineral 600ml", precio: 3000, emoji: "💧", categoria: "bebidas", disponible: true, destacado: false, posicion: 43 },
  { nombre: "Jugo Hit 1.5L", descripcion: "Jugo Hit de 1.5 litros", precio: 7500, emoji: "🧃", categoria: "bebidas", disponible: true, destacado: false, posicion: 44 },
  { nombre: "Coca-Cola Pet 400ml", descripcion: "Coca-Cola pet 400ml", precio: 5000, emoji: "🥤", categoria: "bebidas", disponible: true, destacado: true, posicion: 45 },

  // ===== GRANIZADAS =====
  { nombre: "Granizada Mandarina", descripcion: "Granizada refrescante sabor mandarina", precio: 11000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: true, posicion: 46 },
  { nombre: "Granizada Naranja", descripcion: "Granizada refrescante sabor naranja", precio: 11000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: false, posicion: 47 },
  { nombre: "Granizada Limón", descripcion: "Granizada refrescante sabor limón", precio: 8000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: false, posicion: 48 },
  { nombre: "Granizada Tamarindo", descripcion: "Granizada refrescante sabor tamarindo", precio: 10000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: false, posicion: 49 },
  { nombre: "Granizada Hierbabuena", descripcion: "Granizada refrescante sabor hierbabuena", precio: 11000, emoji: "🧉", categoria: "granizadas", disponible: true, destacado: true, posicion: 50 },
];

async function seed() {
  console.log("🍽️ Seeding catálogo completo TIAMO...");

  // Borrar productos existentes y sembrar de nuevo
  await db.delete(productosTable);
  console.log("  ✓ Productos anteriores eliminados");

  await db.insert(productosTable).values(productos);
  console.log(`✅ ${productos.length} productos del catálogo TIAMO insertados!`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Error en seed:", e);
  process.exit(1);
});
