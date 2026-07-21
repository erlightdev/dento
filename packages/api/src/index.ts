import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

const requireAdmin = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	const user = context.session.user as Record<string, unknown>;
	if (user.role !== "admin") {
		throw new ORPCError("FORBIDDEN", {
			message: "Admin access required",
		});
	}
	if (user.banned) {
		throw new ORPCError("FORBIDDEN", {
			message: "Your account has been banned",
		});
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);
export const adminProcedure = publicProcedure.use(requireAdmin);
