import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/login" });
    }
    if (!session.data.user.emailVerified) {
      throw redirect({ to: "/verify-email" });
    }
    const user = session.data.user as Record<string, unknown>;
    if (user.banned) {
      await authClient.signOut();
      throw redirect({
        to: "/login",
        search: { error: "banned" },
      });
    }
    return { session };
  },
});

function AuthLayout() {
  return <Outlet />;
}
