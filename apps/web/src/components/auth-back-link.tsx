import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export default function AuthBackLink() {
  return (
    <Link
      to="/"
      className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-md border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96] shadow-xs cursor-pointer font-sans"
    >
      <ArrowLeft className="size-3.5" />
      Back to home
    </Link>
  );
}
