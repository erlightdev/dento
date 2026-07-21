import { Button } from "@Dento/ui/components/button";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
	component: VerifyEmailPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/login" });
		}
		if (session.data.user.emailVerified) {
			throw redirect({ to: "/dashboard" });
		}
	},
});

function VerifyEmailPage() {
	const [isSending, setIsSending] = useState(false);
	const { data: session } = authClient.useSession();

	const handleResend = async () => {
		setIsSending(true);
		try {
			await authClient.sendVerificationEmail({
				email: session?.user.email ?? "",
				callbackURL: "/dashboard",
			});
			toast.success("Verification email sent");
		} catch {
			toast.error("Failed to send verification email");
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="flex min-h-svh items-center justify-center p-4">
			<div className="mx-auto max-w-md space-y-6 p-6 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
					<svg
						className="h-8 w-8 text-yellow-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<h1 className="font-bold text-2xl">Verify your email</h1>
				<p className="text-muted-foreground">
					We sent a verification link to{" "}
					<span className="font-medium text-foreground">
						{session?.user.email}
					</span>
					. Click the link in the email to verify your account.
				</p>
				<div className="space-y-3">
					<Button
						onClick={handleResend}
						disabled={isSending}
						className="w-full"
					>
						{isSending ? "Sending..." : "Resend verification email"}
					</Button>
					<Button
						variant="outline"
						onClick={() => authClient.signOut()}
						className="w-full"
					>
						Sign out
					</Button>
				</div>
			</div>
		</div>
	);
}
