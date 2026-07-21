import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Manage users, roles, and sessions.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="/admin/users"
          className="rounded-lg border p-6 hover:bg-accent transition-colors"
        >
          <h3 className="font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground">
            View, ban, and manage user accounts
          </p>
        </a>
      </div>
    </div>
  );
}
