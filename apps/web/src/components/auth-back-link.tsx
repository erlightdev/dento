import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export default function AuthBackLink() {
	return (
		<Link
			to="/"
			className="absolute top-4 left-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border/80 bg-background px-3 py-2 font-sans font-semibold text-muted-foreground text-xs shadow-xs transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
		>
			<ArrowLeft className="size-3.5" />
			Back to home
		</Link>
	);
}
