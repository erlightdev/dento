import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ForgotPasswordForm from "@/components/forgot-password-form";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>): { error?: string } => ({
		error: search.error as string | undefined,
	}),
});

function RouteComponent() {
	const [view, setView] = useState<"signin" | "signup" | "forgot">("signin");
	const { error } = Route.useSearch();

	useEffect(() => {
		if (error === "banned") {
			toast.error("Your account has been banned.");
		}
	}, [error]);

	switch (view) {
		case "signup":
			return <SignUpForm onSwitchToSignIn={() => setView("signin")} />;
		case "forgot":
			return <ForgotPasswordForm onBack={() => setView("signin")} />;
		default:
			return (
				<SignInForm
					onSwitchToSignUp={() => setView("signup")}
					onSwitchToForgotPassword={() => setView("forgot")}
				/>
			);
	}
}
