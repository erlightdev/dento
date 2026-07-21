import type { AppRouterClient } from "@Dento/api/routers/index";
import { Toaster } from "@Dento/ui/components/sonner";
import { createORPCClient } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState } from "react";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { link, type orpc } from "@/utils/orpc";

import "../index.css";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	component: RootComponent,
	head: () => ({
		meta: [
			{
				title: "Dento",
			},
			{
				name: "description",
				content: "Dento is a web application",
			},
		],
		links: [
			{
				rel: "icon",
				href: "/favicon.ico",
			},
		],
	}),
});

const AUTH_ROUTES = ["/login", "/reset-password", "/verify-email"];

function RootComponent() {
	const [client] = useState<AppRouterClient>(() => createORPCClient(link));
	const [_orpcUtils] = useState(() => createTanstackQueryUtils(client));
	const location = useLocation();

	const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

	return (
		<>
			<HeadContent />
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				disableTransitionOnChange
				storageKey="vite-ui-theme"
			>
				{isAuthRoute ? (
					<Outlet />
				) : (
					<div className="min-h-svh">
						<Header />
						<Outlet />
					</div>
				)}
				<Toaster richColors />
			</ThemeProvider>
			<TanStackRouterDevtools position="bottom-left" />
			<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
		</>
	);
}
