import { createContext } from "@Dento/api/context";
import { appRouter } from "@Dento/api/routers/index";
import { auth } from "@Dento/auth";
import { env } from "@Dento/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { initLogger } from "evlog";
import {
	type BetterAuthInstance,
	createAuthMiddleware,
} from "evlog/better-auth";
import { type EvlogVariables, evlog } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

initLogger({
	env: { service: "Dento-server" },
});

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
	exclude: ["/api/auth/**"],
	maskEmail: true,
});

const app = new Hono<EvlogVariables>();

app.use(evlog());
app.use("*", async (c, next) => {
	await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
	await next();
});

app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.post("/api/auth-method", async (c) => {
	const { email } = await c.req
		.json<{ email: string }>()
		.catch(() => ({ email: "" }));
	const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!email || !emailRe.test(email)) {
		return c.json({ error: "invalid_email" }, 400);
	}

	try {
		const { db } = await import("@Dento/db");
		const u = await db.query.user.findFirst({
			where: (fields, { eq }) => eq(fields.email, email.trim().toLowerCase()),
			with: {
				accounts: true,
			},
		});

		if (!u) {
			return c.json({
				exists: false,
				verified: false,
				methods: [],
				hasPassword: false,
			});
		}

		const credentialAccount = u.accounts.find(
			(a) => a.providerId === "credential",
		);
		const hasPassword = !!credentialAccount?.password;

		const methods = [...new Set(u.accounts.map((a) => a.providerId))].filter(
			(p) => ["credential", "github", "google"].includes(p),
		);

		return c.json({
			exists: true,
			verified: u.emailVerified,
			methods,
			hasPassword,
		});
	} catch (err: any) {
		return c.json({ error: err.message || "Database lookup failed" }, 500);
	}
});

app.post("/api/set-password", async (c) => {
	const { password } = await c.req
		.json<{ password?: string }>()
		.catch(() => ({ password: "" }));
	if (!password || password.length < 8) {
		return c.json({ error: "Password must be at least 8 characters." }, 400);
	}

	try {
		await auth.api.setPassword({
			body: { newPassword: password },
			headers: c.req.raw.headers,
		});
		return c.json({ ok: true });
	} catch (err: any) {
		return c.json({ error: err.message || "Could not set the password." }, 400);
	}
});

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

import { serve } from "@hono/node-server";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
