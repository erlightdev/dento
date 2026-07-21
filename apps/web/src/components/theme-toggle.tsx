"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@Dento/ui/components/dropdown-menu";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const { setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch by only rendering after mounting
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="size-9 animate-pulse rounded-md border border-border/80 bg-background/50 shadow-xs" />
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-background text-muted-foreground shadow-xs transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none active:scale-[0.96]"
						aria-label="Toggle theme"
					/>
				}
			>
				<div className="relative size-4">
					<Sun className="absolute inset-0 size-full rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute inset-0 size-full rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
				</div>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				sideOffset={6}
				className="w-32 min-w-32 border border-border/80 bg-popover/95 p-1 shadow-md backdrop-blur-sm"
			>
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className="flex cursor-pointer items-center gap-2"
				>
					<Sun className="size-4 text-muted-foreground" />
					<span>Light</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className="flex cursor-pointer items-center gap-2"
				>
					<Moon className="size-4 text-muted-foreground" />
					<span>Dark</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className="flex cursor-pointer items-center gap-2"
				>
					<Monitor className="size-4 text-muted-foreground" />
					<span>System</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
