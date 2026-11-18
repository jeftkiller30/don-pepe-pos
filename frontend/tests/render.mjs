import assert from "node:assert/strict";
import { createServer } from "../node_modules/vite/dist/node/index.js";
import React from "../node_modules/react/index.js";
import { renderToStaticMarkup } from "../node_modules/react-dom/server.node.js";
import path from "node:path";
import {fileURLToPath} from "node:url";
const vite = await createServer({
  root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { tienda } = await vite.ssrLoadModule("/src/servicios/tienda.ts");
  const render = async (file) =>
    renderToStaticMarkup(
      React.createElement((await vite.ssrLoadModule("/src/" + file)).default),
    );
  assert.match(await render("acceso/Acceso.jsx"), /Inicia sesión/);
  tienda.user.set({
    id: "admin",
    name: "Jefferson",
    role: "ADMIN",
    email: "admin@donpepe.local",
  });
  tienda.loading.set(false);
  const product = {
    id: "p",
    sku: "DP1",
    name: "Inca Kola",
    category: "Bebidas",
    image: "inca-kola",
    stock: 5,
    minStock: 10,
    price: 100,
  };
  tienda.products.set([product]);
  tienda.settings.set({
    name: "Don Pepe",
    address: "Lima",
    phone: "",
    receiptMessage: "Gracias",
  });
  const report = {
    revenue: 200,
    tickets: 1,
    units: 2,
    customers: 0,
    average: 200,
    change: null,
    lowStock: [product],
    topProducts: [{ ...product, quantity: 2, total: 200 }],
    hours: [{ hour: 9, total: 200 }],
    daily: [{ day: "2026-10-27", total: 200 }],
    payments: { CASH: 200, YAPE: 0, CARD: 0 },
    productCount: 1,
    stockValue: 500,
  };
  tienda.dashboard.set(report);
  tienda.report.set(report);
  for (const [folder, file, label] of [
    ["inicio", "Inicio", "Buenos días"],
    ["caja", "Caja", "Tu caja"],
    ["inventario", "Inventario", "Inventario"],
    ["ventas", "Ventas", "Historial de ventas"],
    ["clientes", "Clientes", "Tus clientes"],
    ["reportes", "Reportes", "Reporte"],
    ["configuracion", "Configuracion", "Configuración"],
  ]) {
    tienda.page.set(folder);
    assert.ok(
      (await render(folder + "/" + file + ".jsx")).includes(label),
      folder,
    );
  }
  tienda.add(product);
  tienda.add(product);
  assert.equal(tienda.subtotal(), 200);
  assert.equal(tienda.itemCount(), 2);
  tienda.change("p", -1);
  assert.equal(tienda.subtotal(), 100);
  tienda.query.set("DP1");
  assert.equal(tienda.filteredProducts().length, 1);
  tienda.query.set("inexistente");
  assert.equal(tienda.filteredProducts().length, 0);
  tienda.query.set("");
  tienda.openProduct(product);
  const form = await render("dialogos/Dialogos.jsx");
  assert.match(form, /Precio fijo/);
  assert.match(form, /<select/);
  assert.match(form, /readonly/i);
  tienda.closeModal();
  tienda.user.set({ ...tienda.user(), role: "INVENTORY" });
  assert.equal(tienda.canSell(), false);
  assert.equal(tienda.canStock(), true);
  tienda.user.set({ ...tienda.user(), role: "CASHIER" });
  assert.equal(tienda.canStock(), false);
  assert.equal(tienda.isAdmin(), false);
  tienda.user.set({ ...tienda.user(), role: "ADMIN" });
  const shell = await render("estructura/Estructura.jsx");
  assert.match(shell, /href="\/inventario"/);
  assert.match(shell, /Jefferson/);
  console.log(
    "React: 7 pantallas, acceso, formulario, carrito, filtros, navegación y permisos verificados.",
  );
} finally {
  await vite.close();
}
