import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const base = process.env.IMS_BASE_URL || "http://127.0.0.1:3005";
async function login(identifier, password) {
  const form = new FormData(); form.set("identifier", identifier); form.set("password", password); form.set("rememberMe", "false");
  const response = await fetch(`${base}/api/auth/login`, { method: "POST", body: form });
  assert.equal(response.status, 200, `login failed: ${response.status}`);
  const raw = response.headers.get("set-cookie") || "";
  return raw.split(";")[0];
}
async function call(path, cookie, init = {}) {
  const headers = new Headers(init.headers || {}); headers.set("cookie", cookie);
  const response = await fetch(`${base}${path}`, { ...init, headers });
  const text = await response.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}
async function json(path, cookie, method, body) { return call(path, cookie, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }

const adminCookie = await login("admin@stockroom.test", "Admin123!");
const products = await call("/api/products", adminCookie); assert.equal(products.response.status, 200); assert.ok(products.data.length >= 40);
const categoryId = products.data[0].category.id; const source = products.data[0]; const unique = `AUDIT-${Date.now()}`;
const created = await json("/api/products", adminCookie, "POST", { sku: unique, name: "Audit integration product", categoryId, costPrice: 10, sellPrice: 15, reorderPoint: 2 }); assert.equal(created.response.status, 201);
const clone = await json(`/api/products/${created.data.id}/clone`, adminCookie, "POST", { skuSuffix: "-CLONE" }); assert.equal(clone.response.status, 201);
const exported = await call("/api/products/export", adminCookie); assert.equal(exported.response.status, 200); assert.match(String(exported.data), /sku,barcode,name/);
const form = new FormData(); form.append("file", new Blob([`sku,name,category,costPrice\n${unique},Audit integration product updated,${source.category.name},11\n`], { type: "text/csv" }), "audit.csv"); const imported = await call("/api/products/import", adminCookie, { method: "POST", body: form }); assert.equal(imported.response.status, 200); assert.equal(imported.data.updated, 1);
const supplier = await json("/api/suppliers", adminCookie, "POST", { name: `Audit Supplier ${Date.now()}`, leadTimeDays: 5 }); assert.equal(supplier.response.status, 201);
const warehouses = await call("/api/warehouses", adminCookie); assert.equal(warehouses.response.status, 200); const warehouse = warehouses.data[0]; const location = warehouse.locations[0];
const order = await json("/api/purchase-orders", adminCookie, "POST", { supplierId: supplier.data.id, warehouseId: warehouse.id, status: "ORDERED", lines: [{ productId: created.data.id, orderedQty: 3, unitCost: 10 }] }); assert.equal(order.response.status, 201);
const received = await json(`/api/purchase-orders/${order.data.id}/receive`, adminCookie, "POST", { locationId: location.id, lines: [{ lineId: order.data.lines[0].id, quantity: 3 }], reason: "Integration receipt" }); assert.equal(received.response.status, 200);
const orderAfter = await call(`/api/purchase-orders/${order.data.id}`, adminCookie); assert.equal(orderAfter.data.status, "RECEIVED");
const stock = await call(`/api/stock?productId=${created.data.id}&locationId=${location.id}`, adminCookie); assert.equal(stock.response.status, 200); assert.equal(stock.data[0].quantity, 3);
const tracked = await json("/api/scan/action", adminCookie, "POST", { kind: "product", id: created.data.id, action: "receive", quantity: 1, locationId: location.id, reason: "Batch receipt", reference: "GRN-AUDIT", batchNumber: "LOT-AUDIT", expiryDate: "2027-01-31" }); assert.equal(tracked.response.status, 200); const productAfterTracked = await call(`/api/products/${created.data.id}`, adminCookie); assert.equal(productAfterTracked.data.movements[0].batchNumber, "LOT-AUDIT"); assert.equal(productAfterTracked.data.movements[0].reference, "GRN-AUDIT");
const stocktake = await json("/api/stocktakes", adminCookie, "POST", { name: `Audit count ${Date.now()}`, warehouseId: warehouse.id }); assert.equal(stocktake.response.status, 201); const sheet = await call(`/api/stocktakes/${stocktake.data.id}`, adminCookie); const firstCount = sheet.data.counts[0]; const saved = await json(`/api/stocktakes/${stocktake.data.id}`, adminCookie, "PATCH", { counts: [{ id: firstCount.id, countedQuantity: firstCount.systemQuantity + 1 }] }); assert.equal(saved.response.status, 200); const completed = await call(`/api/stocktakes/${stocktake.data.id}/complete`, adminCookie, { method: "POST" }); assert.equal(completed.response.status, 200); assert.equal(completed.data.status, "COMPLETED");
const report = await call("/api/reports?type=inventory&format=csv", adminCookie); assert.equal(report.response.status, 200); assert.match(String(report.data), /daysOfStock/);
const staffCookie = await login("operator", "Staff123!"); const forbidden = await call("/api/admin/users", staffCookie); assert.equal(forbidden.response.status, 403);
const invalid = await json("/api/scan/action", staffCookie, "POST", { kind: "product", id: created.data.id, action: "receive", quantity: 0, locationId: location.id, reason: "invalid" }); assert.equal(invalid.response.status, 400);
const resetRequestForm = new FormData(); resetRequestForm.set("identifier", "operator"); const resetRequested = await call("/api/auth/request-reset", adminCookie, { method: "POST", body: resetRequestForm }); assert.equal(resetRequested.response.status, 200);
const prisma = new PrismaClient(); const resetUser = await prisma.user.findUnique({ where: { username: "operator" } }); assert.ok(resetUser); const resetToken = await prisma.passwordResetToken.findFirst({ where: { userId: resetUser.id, usedAt: null }, orderBy: { createdAt: "desc" } }); assert.ok(resetToken); const reset = await json("/api/auth/reset", adminCookie, "POST", { token: resetToken.token, password: "TempReset123!" }); assert.equal(reset.response.status, 200); const resetLogin = await login("operator", "TempReset123!"); assert.ok(resetLogin); const restoreForm = new FormData(); restoreForm.set("identifier", "operator"); await call("/api/auth/request-reset", resetLogin, { method: "POST", body: restoreForm }); const restoreToken = await prisma.passwordResetToken.findFirst({ where: { userId: resetUser.id, usedAt: null }, orderBy: { createdAt: "desc" } }); assert.ok(restoreToken); const restored = await json("/api/auth/reset", resetLogin, "POST", { token: restoreToken.token, password: "Staff123!" }); assert.equal(restored.response.status, 200); await prisma.$disconnect();
console.log("IMS integration checks passed: auth, CRUD, clone, CSV, receiving, stocktake, reporting, and admin boundary.");
