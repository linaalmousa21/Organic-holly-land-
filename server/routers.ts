import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { archiveProduct, calculateOrderFromDatabase, calculateShipping, createCategory, createProduct, createOrder, deleteCategory, getAdminCatalog, getAdminCategories, getAllOrders, getCatalog, getCategories, getOrdersForUser, updateCategory, updateOrderStatus, updateProduct } from "./db";
import { z } from "zod";

const checkoutItem = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutInput = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(40),
  address: z.string().trim().min(5).max(1000),
  city: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(checkoutItem).min(1).max(50),
});

const orderStatus = z.enum(["pending", "confirmed", "shipped", "cancelled"]);
const productInput = z.object({
  categoryId: z.number().int().positive(), name: z.string().trim().min(2).max(180), subtitle: z.string().trim().min(2).max(255),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/), unitLabel: z.string().trim().min(1).max(60), tag: z.string().trim().max(80).optional(),
  image: z.string().trim().max(500).optional(), art: z.string().trim().min(1).max(60), emoji: z.string().trim().min(1).max(8),
  stockQuantity: z.number().int().min(0).max(100000), lowStockThreshold: z.number().int().min(0).max(100000), sortOrder: z.number().int().min(0).max(100000), isActive: z.boolean().optional().default(true),
});
const categoryInput = z.object({ name: z.string().trim().min(2).max(100), note: z.string().trim().min(2).max(180), emoji: z.string().trim().min(1).max(8), sortOrder: z.number().int().min(0).max(100000), isFeatured: z.boolean() });

export const appRouter = router({
  system: systemRouter,
  catalog: router({
    list: publicProcedure.query(() => getCatalog()),
    categories: publicProcedure.query(() => getCategories()),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  orders: router({
    create: publicProcedure.input(checkoutInput).mutation(async ({ ctx, input }) => {
      const order = await createOrder(input, ctx.user?.id);
      return {
        success: true as const,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        total: order.total,
        shippingLabel: calculateShipping(input.city).label,
        currency: "JOD" as const,
        paymentStatus: order.paymentStatus,
      };
    }),
    quote: publicProcedure.input(checkoutInput.pick({ city: true, items: true })).query(async ({ input }) => {
      const totals = await calculateOrderFromDatabase({ name: "quote", email: "quote@example.com", phone: "0000000", address: "quote", city: input.city, items: input.items });
      return { subtotal: totals.subtotal, shippingFee: totals.shippingFee, total: totals.total, shippingLabel: calculateShipping(input.city).label, currency: "JOD" as const };
    }),
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return getOrdersForUser(ctx.user.id);
    }),
  }),
  admin: router({
    orders: adminProcedure.query(() => getAllOrders()),
    updateOrderStatus: adminProcedure.input(z.object({ orderId: z.number().int().positive(), status: orderStatus })).mutation(({ input }) => updateOrderStatus(input.orderId, input.status)),
    catalog: adminProcedure.query(() => getAdminCatalog()),
    categories: adminProcedure.query(() => getAdminCategories()),
    createProduct: adminProcedure.input(productInput).mutation(({ input }) => createProduct(input)),
    updateProduct: adminProcedure.input(z.object({ id: z.number().int().positive(), data: productInput })).mutation(({ input }) => updateProduct(input.id, input.data)),
    archiveProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => archiveProduct(input.id)),
    createCategory: adminProcedure.input(categoryInput).mutation(({ input }) => createCategory(input)),
    updateCategory: adminProcedure.input(z.object({ id: z.number().int().positive(), data: categoryInput })).mutation(({ input }) => updateCategory(input.id, input.data)),
    deleteCategory: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteCategory(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
