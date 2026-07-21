import { ORPCError, type RouterClient } from "@orpc/server";
import { eq, like, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@Dento/db";
import { session, user } from "@Dento/db/schema/auth";

import { adminProcedure, protectedProcedure, publicProcedure } from "../index";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  getProfile: protectedProcedure.handler(({ context }) => {
    return context.session?.user;
  }),
  admin: {
    listUsers: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
            search: z.string().optional(),
          })
          .optional(),
      )
      .handler(async ({ input }) => {
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        const whereClause = input?.search
          ? like(user.email, `%${input.search}%`)
          : undefined;

        const users = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            banned: user.banned,
            banReason: user.banReason,
            banExpires: user.banExpires,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          })
          .from(user)
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(user.createdAt);

        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(user)
          .where(whereClause);

        return { users, total: countResult[0]?.count ?? 0 };
      }),

    banUser: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          reason: z.string().min(1),
          expiresAt: z.string().datetime().optional(),
        }),
      )
      .handler(async ({ input, context }) => {
        const currentUser = context.session?.user as Record<string, unknown>;
        if (input.userId === currentUser.id) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Cannot ban yourself",
          });
        }

        const [target] = await db
          .select()
          .from(user)
          .where(eq(user.id, input.userId))
          .limit(1);

        if (!target) {
          throw new ORPCError("NOT_FOUND", { message: "User not found" });
        }

        if (target.role === "admin") {
          throw new ORPCError("FORBIDDEN", {
            message: "Cannot ban an admin user",
          });
        }

        await db
          .update(user)
          .set({
            banned: true,
            banReason: input.reason,
            banExpires: input.expiresAt ? new Date(input.expiresAt) : null,
          })
          .where(eq(user.id, input.userId));

        await db.delete(session).where(eq(session.userId, input.userId));

        return { success: true };
      }),

    unbanUser: adminProcedure
      .input(z.object({ userId: z.string() }))
      .handler(async ({ input }) => {
        await db
          .update(user)
          .set({ banned: false, banReason: null, banExpires: null })
          .where(eq(user.id, input.userId));

        return { success: true };
      }),

    setRole: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          role: z.enum(["user", "admin"]),
        }),
      )
      .handler(async ({ input, context }) => {
        const currentUser = context.session?.user as Record<string, unknown>;
        if (input.userId === currentUser.id) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Cannot change your own role",
          });
        }

        await db
          .update(user)
          .set({ role: input.role })
          .where(eq(user.id, input.userId));

        return { success: true };
      }),

    deleteUser: adminProcedure
      .input(z.object({ userId: z.string() }))
      .handler(async ({ input, context }) => {
        const currentUser = context.session?.user as Record<string, unknown>;
        if (input.userId === currentUser.id) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Cannot delete yourself",
          });
        }

        const [target] = await db
          .select()
          .from(user)
          .where(eq(user.id, input.userId))
          .limit(1);

        if (!target) {
          throw new ORPCError("NOT_FOUND", { message: "User not found" });
        }

        if (target.role === "admin") {
          throw new ORPCError("FORBIDDEN", {
            message: "Cannot delete an admin user",
          });
        }

        await db.delete(session).where(eq(session.userId, input.userId));
        await db.delete(user).where(eq(user.id, input.userId));

        return { success: true };
      }),

    revokeSession: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .handler(async ({ input }) => {
        await db.delete(session).where(eq(session.id, input.sessionId));
        return { success: true };
      }),

    listUserSessions: adminProcedure
      .input(z.object({ userId: z.string() }))
      .handler(async ({ input }) => {
        const sessions = await db
          .select({
            id: session.id,
            token: session.token,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
          })
          .from(session)
          .where(eq(session.userId, input.userId));

        return sessions;
      }),
  },
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
