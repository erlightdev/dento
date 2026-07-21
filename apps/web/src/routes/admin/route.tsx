import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
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
      throw redirect({ to: "/login", search: { error: "banned" } });
    }
    if (user.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
    return { session };
  },
});

function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      <aside className="w-56 border-r p-4">
        <h2 className="mb-4 text-lg font-semibold">Admin</h2>
        <nav className="space-y-1">
          <a
            href="/admin"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Dashboard
          </a>
          <a
            href="/admin/users"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            Users
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
