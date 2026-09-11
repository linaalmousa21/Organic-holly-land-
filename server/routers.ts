import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { calculateOrder, calculateShipping, createOrder, getOrdersForUser } from "./db";
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

export const appRouter = router({
  system: systemRouter,
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
    quote: publicProcedure.input(checkoutInput.pick({ city: true, items: true })).query(({ input }) => {
      const totals = calculateOrder({ name: "quote", email: "quote@example.com", phone: "0000000", address: "quote", city: input.city, items: input.items });
      return { subtotal: totals.subtotal, shippingFee: totals.shippingFee, total: totals.total, shippingLabel: calculateShipping(input.city).label, currency: "JOD" as const };
    }),
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return getOrdersForUser(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
