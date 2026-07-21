import { Link, useLocation } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

import ThemeToggle from "./theme-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const { data: session } = authClient.useSession();
	const user = session?.user as Record<string, unknown> | undefined;
	const isAdmin = user?.role === "admin";
	const [announcementOpen, setAnnouncementOpen] = useState(true);
	const location = useLocation();
	const isHome = location.pathname === "/";

	const links = [
		{ to: "/", label: "Home" },
		{ to: "/dashboard", label: "Dashboard" },
		...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
	] as const;

	return (
		<header
			className={
				isHome
					? "pointer-events-none fixed top-0 right-0 left-0 z-50 w-full"
					: "sticky top-0 z-50 w-full"
			}
		>
			{isHome && announcementOpen && (
				<div className="pointer-events-auto relative flex w-full items-center justify-center bg-foreground px-12 py-2 text-center text-background text-sm">
					<div className="flex items-center justify-center gap-2">
						<span className="font-medium">New: Smart scheduling is here</span>
						<span className="hidden text-background/60 sm:inline">
							&mdash; Book appointments faster with AI-powered slot suggestions.
						</span>
						<Link
							to="/dashboard"
							className="ml-1 font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
						>
							Try it now
						</Link>
					</div>
					<button
						type="button"
						onClick={() => setAnnouncementOpen(false)}
						aria-label="Dismiss announcement"
						className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-background/60 transition-all hover:bg-background/10 hover:text-background active:scale-[0.96]"
					>
						<XIcon className="size-4" />
					</button>
				</div>
			)}
			<div
				className={`flex items-center justify-center transition-all duration-300 ${
					isHome
						? "pointer-events-auto mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl rounded-lg border border-border/30 bg-background/60 px-6 py-2.5 shadow-lg backdrop-blur-xl"
						: "border-border/40 border-b bg-background/70 px-4 py-3 backdrop-blur-xl"
				}`}
			>
				<div className="flex w-full max-w-7xl items-center justify-between">
					<nav className="flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 shadow-black/5 shadow-lg backdrop-blur-md">
						{links.map(({ to, label }) => (
							<Link
								key={to}
								to={to}
								className="rounded-full px-3.5 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground [&.active]:bg-foreground [&.active]:text-background [&.active]:shadow-sm"
							>
								{label}
							</Link>
						))}
					</nav>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<UserMenu />
					</div>
				</div>
			</div>
		</header>
	);
}
