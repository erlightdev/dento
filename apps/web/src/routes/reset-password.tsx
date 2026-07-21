import { createFileRoute } from "@tanstack/react-router";

import ResetPasswordForm from "@/components/reset-password-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: String(search.token ?? ""),
	}),
	beforeLoad: async () => {
		const session = await authClient.getSession();

		if (session.data) {
			throw new Response(null, {
				status: 302,
				headers: {
					Location: "/dashboard",
				},
			});
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <ResetPasswordForm />;
}
