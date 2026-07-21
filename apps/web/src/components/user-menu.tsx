import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@Dento/ui/components/dropdown-menu";
import { Skeleton } from "@Dento/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-20 rounded-md" />;
	}

	if (!session) {
		return (
			<Link to="/login">
				<button
					type="button"
					className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-background px-4 font-semibold text-muted-foreground text-sm shadow-xs transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none active:scale-[0.96]"
				>
					Sign In
				</button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-background px-4 font-semibold text-muted-foreground text-sm shadow-xs transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none active:scale-[0.96]"
					/>
				}
			>
				{session.user.name}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<span className="font-medium text-foreground text-sm">
							{session.user.name}
						</span>
						<span className="block font-normal text-muted-foreground text-xs">
							{session.user.email}
						</span>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({ to: "/" });
									},
								},
							});
						}}
					>
						<LogOutIcon data-icon="inline-end" />
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
