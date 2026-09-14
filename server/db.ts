import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, categories, customers, orderItems, orders, payments, products, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCatalog() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: products.id,
    name: products.name,
    subtitle: products.subtitle,
    price: products.price,
    unitLabel: products.unitLabel,
    tag: products.tag,
    image: products.image,
    art: products.art,
    emoji: products.emoji,
    stockQuantity: products.stockQuantity,
    lowStockThreshold: products.lowStockThreshold,
    category: categories.name,
    categoryNote: categories.note,
    categoryEmoji: categories.emoji,
    categoryIsFeatured: categories.isFeatured,
    sortOrder: products.sortOrder,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.isActive, true)).orderBy(asc(products.sortOrder));
}

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: categories.id, name: categories.name, note: categories.note, emoji: categories.emoji, isFeatured: categories.isFeatured, sortOrder: categories.sortOrder })
    .from(categories).orderBy(asc(categories.sortOrder));
}

export async function getAdminCatalog() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: products.id, categoryId: products.categoryId, name: products.name, subtitle: products.subtitle,
    price: products.price, unitLabel: products.unitLabel, tag: products.tag, image: products.image,
    art: products.art, emoji: products.emoji, stockQuantity: products.stockQuantity,
    lowStockThreshold: products.lowStockThreshold, sortOrder: products.sortOrder, isActive: products.isActive,
    category: categories.name,
  }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).orderBy(asc(products.sortOrder));
}

export async function getAdminCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function createProduct(input: {
  categoryId: number; name: string; subtitle: string; price: string; unitLabel: string; tag?: string;
  image?: string; art: string; emoji: string; stockQuantity: number; lowStockThreshold: number; sortOrder: number; isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(products).values({ ...input, tag: input.tag || null, image: input.image || null });
  return { id: Number(result[0].insertId) };
}

export async function updateProduct(id: number, input: {
  categoryId: number; name: string; subtitle: string; price: string; unitLabel: string; tag?: string;
  image?: string; art: string; emoji: string; stockQuantity: number; lowStockThreshold: number; sortOrder: number; isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(products).set({ ...input, tag: input.tag || null, image: input.image || null, updatedAt: new Date() }).where(eq(products.id, id));
  return { id };
}

export async function archiveProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
  return { id, isActive: false };
}

export async function createCategory(input: { name: string; note: string; emoji: string; sortOrder: number; isFeatured: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(categories).values(input);
  return { id: Number(result[0].insertId) };
}

export async function updateCategory(id: number, input: { name: string; note: string; emoji: string; sortOrder: number; isFeatured: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(categories).set(input).where(eq(categories.id, id));
  return { id };
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const linkedProducts = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
  if (linkedProducts.length) throw new Error("لا يمكن حذف تصنيف يحتوي على منتجات؛ انقل المنتجات أولاً");
  await db.delete(categories).where(eq(categories.id, id));
  return { id };
}

export async function upsertClerkUser(input: { clerkUserId: string; name?: string | null; email?: string | null; role?: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const openId = `clerk:${input.clerkUserId}`;
  await db.insert(users).values({
    openId,
    clerkUserId: input.clerkUserId,
    name: input.name ?? null,
    email: input.email ?? null,
    loginMethod: "clerk",
    role: input.role ?? "user",
    lastSignedIn: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      clerkUserId: input.clerkUserId,
      name: input.name ?? null,
      email: input.email ?? null,
      loginMethod: "clerk",
      role: input.role ?? "user",
      lastSignedIn: new Date(),
    },
  });
  const result = await db.select().from(users).where(eq(users.clerkUserId, input.clerkUserId)).limit(1);
  if (!result[0]) throw new Error("Unable to create Clerk user");
  return result[0];
}

export const ORDER_CATALOG = {
  1: { name: "زيت زيتون بكر ممتاز", price: 12 },
  2: { name: "عسل جبلي خام", price: 8.5 },
  3: { name: "زعتر بلدي مع السمسم", price: 3.5 },
  4: { name: "ورق عنب بلدي", price: 4.75 },
  5: { name: "لبنة بالزعتر", price: 3.25 },
  6: { name: "دبس رمان أصلي", price: 5 },
} as const;

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  items: Array<{ productId: number; quantity: number }>;
};

const SHIPPING_FEES: Record<string, number> = {
  "عمان": 2,
  "إربد": 2,
  "الزرقاء": 2.5,
  "جرش": 2.25,
  "عجلون": 2.25,
  "المفرق": 2.5,
  "السلط": 2.5,
  "البلقاء": 2.5,
  "الكرك": 3.5,
  "الطفيلة": 3.5,
  "معان": 4,
  "العقبة": 4,
};

export function calculateShipping(city: string) {
  const normalizedCity = city.trim();
  return {
    city: normalizedCity,
    fee: SHIPPING_FEES[normalizedCity] ?? 3,
    label: SHIPPING_FEES[normalizedCity] === undefined ? "باقي المحافظات" : normalizedCity,
  };
}

function makeOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OHL-${stamp}-${suffix}`;
}

export function calculateOrder(input: CheckoutInput) {
  if (!input.items.length) throw new Error("Order must contain at least one item");
  const normalizedItems = input.items.map((item) => {
    const product = ORDER_CATALOG[item.productId as keyof typeof ORDER_CATALOG];
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new Error("Quantity must be between 1 and 99");
    }
    const lineTotal = Number((product.price * item.quantity).toFixed(2));
    return { ...item, productName: product.name, unitPrice: product.price, lineTotal };
  });
  const subtotal = Number(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const shippingFee = calculateShipping(input.city).fee;
  return { items: normalizedItems, subtotal, shippingFee, total: Number((subtotal + shippingFee).toFixed(2)) };
}

export async function calculateOrderFromDatabase(input: CheckoutInput) {
  const catalog = await getCatalog();
  if (!catalog.length) throw new Error("Catalog is not configured");
  const normalizedItems = input.items.map((item) => {
    const product = catalog.find((candidate) => candidate.id === item.productId);
    if (!product) throw new Error(`Unknown product: ${item.productId}`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("Quantity must be between 1 and 99");
    if (item.quantity > product.stockQuantity) throw new Error(`الكمية المتاحة من ${product.name} هي ${product.stockQuantity} فقط`);
    const unitPrice = Number(product.price);
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
    return { ...item, productName: product.name, unitPrice, lineTotal };
  });
  const subtotal = Number(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const shippingFee = calculateShipping(input.city).fee;
  return { items: normalizedItems, subtotal, shippingFee, total: Number((subtotal + shippingFee).toFixed(2)) };
}

export async function createOrder(input: CheckoutInput, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const totals = await calculateOrderFromDatabase(input);
  const orderNumber = makeOrderNumber();

  return db.transaction(async (tx) => {
    const customerResult = await tx.insert(customers).values({
      userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      notes: input.notes?.trim() || null,
    });
    const customerId = Number(customerResult[0].insertId);
    const orderResult = await tx.insert(orders).values({
      orderNumber,
      customerId,
      status: "pending",
      paymentStatus: "pending",
      currency: "JOD",
      subtotal: totals.subtotal.toFixed(2),
      shippingFee: totals.shippingFee.toFixed(2),
      total: totals.total.toFixed(2),
      customerName: input.name.trim(),
      customerEmail: input.email.trim().toLowerCase(),
      customerPhone: input.phone.trim(),
      shippingAddress: input.address.trim(),
      shippingCity: input.city.trim(),
    });
    const orderId = Number(orderResult[0].insertId);
    await tx.insert(orderItems).values(totals.items.map((item) => ({
      orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      lineTotal: item.lineTotal.toFixed(2),
    })));
    for (const item of totals.items) {
      const stockUpdate = await tx.update(products).set({
        stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
        updatedAt: new Date(),
      }).where(and(eq(products.id, item.productId), gte(products.stockQuantity, item.quantity)));
      if (Number(stockUpdate[0].affectedRows) !== 1) throw new Error("المخزون تغير أثناء إتمام الطلب، يرجى المحاولة مجدداً");
    }
    return { orderId, orderNumber, ...totals, paymentStatus: "pending" as const };
  });
}

export async function getOrdersForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    total: orders.total,
    currency: orders.currency,
    createdAt: orders.createdAt,
  }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(customers.userId, userId)).orderBy(desc(orders.createdAt));
}

/** Creates a pending HyperPay order without committing inventory. */
export async function createPendingOrder(input: CheckoutInput, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const totals = await calculateOrderFromDatabase(input);
  const orderNumber = makeOrderNumber();

  return db.transaction(async (tx) => {
    const customerResult = await tx.insert(customers).values({
      userId, name: input.name.trim(), email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(), address: input.address.trim(), city: input.city.trim(),
      notes: input.notes?.trim() || null,
    });
    const customerId = Number(customerResult[0].insertId);
    const orderResult = await tx.insert(orders).values({
      orderNumber, customerId, status: "pending", paymentStatus: "pending", currency: "JOD",
      subtotal: totals.subtotal.toFixed(2), shippingFee: totals.shippingFee.toFixed(2), total: totals.total.toFixed(2),
      customerName: input.name.trim(), customerEmail: input.email.trim().toLowerCase(), customerPhone: input.phone.trim(),
      shippingAddress: input.address.trim(), shippingCity: input.city.trim(),
    });
    const orderId = Number(orderResult[0].insertId);
    await tx.insert(orderItems).values(totals.items.map((item) => ({
      orderId, productId: item.productId, productName: item.productName, quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2), lineTotal: item.lineTotal.toFixed(2),
    })));
    return { orderId, orderNumber, ...totals, paymentStatus: "pending" as const, currency: "JOD" as const };
  });
}

export async function createPaymentAttempt(input: { orderId: number; amount: number; currency: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const result = await db.insert(payments).values({
    orderId: input.orderId, provider: "hyperpay", amount: input.amount.toFixed(2), currency: input.currency, status: "created",
  });
  return { paymentId: Number(result[0].insertId) };
}

export async function updatePaymentCheckout(input: { paymentId: number; checkoutId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(payments).set({ checkoutId: input.checkoutId, status: "pending", updatedAt: new Date() }).where(eq(payments.id, input.paymentId));
  return { paymentId: input.paymentId, checkoutId: input.checkoutId, status: "pending" as const };
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    status: orders.status,
    paymentStatus: orders.paymentStatus,
    total: orders.total,
    currency: orders.currency,
    customerName: orders.customerName,
    customerEmail: orders.customerEmail,
    shippingCity: orders.shippingCity,
    createdAt: orders.createdAt,
  }).from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, status: "pending" | "confirmed" | "shipped" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
  return { orderId, status };
}
