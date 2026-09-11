import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, customers, orderItems, orders, users } from "../drizzle/schema";
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

export async function createOrder(input: CheckoutInput, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const totals = calculateOrder(input);
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
