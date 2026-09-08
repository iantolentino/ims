import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const productNames = [
  "A4 Copy Paper 80gsm", "Ballpoint Pen Blue", "Ballpoint Pen Black", "Permanent Marker", "Packing Tape 48mm", "Bubble Wrap Roll", "Shipping Label 4x6", "Kraft Mailer Small", "Kraft Mailer Large", "Cable Tie 200mm",
  "USB-C Cable 1m", "USB-C Cable 2m", "HDMI Cable 2m", "Wireless Mouse", "Keyboard Compact", "Laptop Stand", "Power Strip 6-way", "AA Battery 4-pack", "AAA Battery 4-pack", "Screen Cleaner",
  "Hand Soap 500ml", "Disinfectant Spray", "Microfiber Cloth", "Nitrile Gloves M", "Nitrile Gloves L", "Safety Vest", "Safety Glasses", "Earplugs Pack", "First Aid Refill", "Shipping Scissors",
  "Utility Knife", "Replacement Blades", "Pallet Wrap", "Carton 12x10x8", "Carton 18x14x10", "Carton 24x18x12", "Wood Pallet", "Marker Label Roll", "Inventory Tag", "Barcode Scanner Stand",
];

async function main() {
  await db.stocktakeCount.deleteMany();
  await db.stocktakeSession.deleteMany();
  await db.assetEvent.deleteMany();
  await db.asset.deleteMany();
  await db.stockMovement.deleteMany();
  await db.stockLevel.deleteMany();
  await db.purchaseOrderLine.deleteMany();
  await db.purchaseOrderAttachment.deleteMany();
  await db.purchaseOrder.deleteMany();
  await db.productSupplier.deleteMany();
  await db.productPriceTier.deleteMany();
  await db.productAttachment.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.location.deleteMany();
  await db.warehouse.deleteMany();
  await db.supplier.deleteMany();
  await db.auditLog.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  const admin = await db.user.create({ data: { username: "admin", email: "admin@stockroom.test", displayName: "Mara Santos", role: "ADMIN", passwordHash: await bcrypt.hash("Admin123!", 10) } });
  const staff = await db.user.create({ data: { username: "operator", email: "operator@stockroom.test", displayName: "Luis Reyes", role: "STAFF", passwordHash: await bcrypt.hash("Staff123!", 10) } });

  const categories = await Promise.all(([
    ["Packaging", "packaging", 20], ["Technology", "technology", 5], ["Safety", "safety", 10], ["Office supplies", "office-supplies", 8],
  ] as Array<[string, string, number]>).map(([name, slug, defaultReorder]) => db.category.create({ data: { name, slug, defaultReorder } })));
  const [packaging, technology, safety, office] = categories;
  const categoryFor = (index: number) => index < 10 ? packaging.id : index < 20 ? technology.id : index < 30 ? safety.id : office.id;

  const central = await db.warehouse.create({ data: { name: "Central Distribution", code: "CD-01", address: "14 Pioneer Avenue" } });
  const north = await db.warehouse.create({ data: { name: "North Satellite", code: "NS-01", address: "88 North Loop" } });
  const locations = await Promise.all([
    db.location.create({ data: { warehouseId: central.id, name: "Main floor", code: "A-01" } }),
    db.location.create({ data: { warehouseId: central.id, name: "Bulk racks", code: "B-01" } }),
    db.location.create({ data: { warehouseId: north.id, name: "Front cage", code: "C-01" } }),
  ]);
  const supplierA = await db.supplier.create({ data: { name: "Metro Office & Trade", contactName: "Ari Villanueva", email: "orders@metrotrade.test", phone: "+63 2 8555 0144", leadTimeDays: 7 } });
  const supplierB = await db.supplier.create({ data: { name: "Northline Industrial Supply", contactName: "Bea Cruz", email: "sales@northline.test", phone: "+63 917 555 0198", leadTimeDays: 12 } });

  const assets = await Promise.all([
    db.asset.create({ data: { tag: "AST-CHAIR-001", name: "Ergonomic Chair 01", description: "Operations desk chair", serialNumber: "CH-2026-001", locationId: locations[0].id, ownerName: "Mara Santos", status: "IN_USE" } }),
    db.asset.create({ data: { tag: "AST-SCAN-001", name: "Zebra Barcode Scanner", description: "Handheld receiving scanner", serialNumber: "ZB-2026-014", locationId: locations[0].id, status: "IN_STORAGE" } }),
    db.asset.create({ data: { tag: "AST-LAP-001", name: "Warehouse Laptop", description: "Shared warehouse-floor laptop", serialNumber: "LT-2026-008", locationId: locations[2].id, status: "UNDER_REPAIR" } }),
  ]);
  await db.assetEvent.createMany({ data: assets.map((asset) => ({ assetId: asset.id, userId: admin.id, type: "CREATED", details: "Demo asset registered", toLocationId: asset.locationId })) });

  const products = [];
  for (let index = 0; index < productNames.length; index += 1) {
    const sku = `SKU-${String(index + 1).padStart(4, "0")}`;
    const product = await db.product.create({
      data: {
        sku, barcode: `480000${String(index + 1).padStart(6, "0")}`, name: productNames[index], categoryId: categoryFor(index),
        description: `Demo catalog item for ${productNames[index].toLowerCase()}.`, unitOfMeasure: index === 36 ? "pallet" : "unit",
        costPrice: 35 + index * 7.5, sellPrice: 55 + index * 11, taxRate: index % 3 === 0 ? 12 : 0, taxInclusive: index % 3 === 0,
        reorderPoint: 5 + (index % 4) * 5, reorderQuantity: 20 + (index % 3) * 10,
        priceTiers: { create: [{ name: "Wholesale", price: 48 + index * 9 }, { name: "Retail", price: 55 + index * 11 }] },
      },
    });
    await db.productSupplier.create({ data: { productId: product.id, supplierId: index % 3 === 0 ? supplierB.id : supplierA.id, supplierSku: `SUP-${String(index + 1).padStart(4, "0")}` } });
    products.push(product);
  }

  for (const [index, product] of products.entries()) {
    const firstQuantity = index % 7 === 0 ? 2 : 18 + (index * 7) % 80;
    const secondQuantity = index % 9 === 0 ? 1 : 8 + (index * 3) % 35;
    await db.stockLevel.createMany({ data: [{ productId: product.id, warehouseId: central.id, locationId: locations[0].id, quantity: firstQuantity }, { productId: product.id, warehouseId: north.id, locationId: locations[2].id, quantity: secondQuantity }] });
    await db.stockMovement.create({ data: { type: "RECEIVE", productId: product.id, warehouseId: central.id, locationId: locations[0].id, userId: admin.id, quantity: firstQuantity, quantityBefore: 0, quantityAfter: firstQuantity, reason: "Opening stock", reference: "OPENING-2026" } });
    if (index < 16) await db.stockMovement.create({ data: { type: "ISSUE", productId: product.id, warehouseId: north.id, locationId: locations[2].id, userId: staff.id, quantity: -Math.max(1, Math.floor(index / 3) + 1), quantityBefore: secondQuantity + Math.max(1, Math.floor(index / 3) + 1), quantityAfter: secondQuantity, reason: "Demo dispatch", reference: `SO-${String(index + 1).padStart(4, "0")}` } });
  }

  const po = await db.purchaseOrder.create({ data: { orderNumber: "PO-2026-0001", supplierId: supplierA.id, warehouseId: central.id, status: "PARTIALLY_RECEIVED", orderedAt: new Date(Date.now() - 4 * 86_400_000), expectedAt: new Date(Date.now() + 3 * 86_400_000), notes: "Top-up stock for the monthly dispatch cycle." } });
  await db.purchaseOrderLine.createMany({ data: products.slice(0, 4).map((product, index) => ({ purchaseOrderId: po.id, productId: product.id, orderedQty: 50 + index * 10, receivedQty: 25, unitCost: product.costPrice })) });
  await db.auditLog.createMany({ data: [{ userId: admin.id, action: "SEED", entity: "System", details: "Demo dataset created" }, { userId: staff.id, action: "LOGIN", entity: "User", entityId: staff.id }] });
  console.log(`Seeded ${products.length} products, 2 warehouses, 3 locations, and demo movement history.`);
  console.log("Admin login: admin@stockroom.test / Admin123!");
  console.log("Staff login: operator / Staff123!");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
