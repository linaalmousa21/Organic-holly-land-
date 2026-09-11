import { int, mysqlEnum, mysqlTable, decimal, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus auth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  clerkUserId: varchar("clerkUserId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  note: varchar("note", { length: 180 }).notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unitLabel: varchar("unitLabel", { length: 60 }).notNull(),
  tag: varchar("tag", { length: 80 }),
  image: varchar("image", { length: 500 }),
  art: varchar("art", { length: 60 }).notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId"), name: varchar("name", { length: 160 }).notNull(), email: varchar("email", { length: 320 }).notNull(), phone: varchar("phone", { length: 40 }).notNull(), address: text("address").notNull(), city: varchar("city", { length: 100 }).notNull(), notes: text("notes"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(), orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(), customerId: int("customerId").notNull(), status: mysqlEnum("status", ["pending", "confirmed", "shipped", "cancelled"]).default("pending").notNull(), paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed"]).default("pending").notNull(), currency: varchar("currency", { length: 3 }).default("JOD").notNull(), subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), shippingFee: decimal("shippingFee", { precision: 10, scale: 2 }).default("0.00").notNull(), total: decimal("total", { precision: 10, scale: 2 }).notNull(), customerName: varchar("customerName", { length: 160 }).notNull(), customerEmail: varchar("customerEmail", { length: 320 }).notNull(), customerPhone: varchar("customerPhone", { length: 40 }).notNull(), shippingAddress: text("shippingAddress").notNull(), shippingCity: varchar("shippingCity", { length: 100 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(), orderId: int("orderId").notNull(), productId: int("productId").notNull(), productName: varchar("productName", { length: 180 }).notNull(), quantity: int("quantity").notNull(), unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
