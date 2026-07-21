import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
});

function AdminDashboard() {
	return (
		<div className="space-y-6">
			<h1 className="font-bold text-2xl">Admin Dashboard</h1>
			<p className="text-muted-foreground">
				Manage users, roles, and sessions.
			</p>
			<div className="grid gap-4 md:grid-cols-2">
				<a
					href="/admin/users"
					className="rounded-lg border p-6 transition-colors hover:bg-accent"
				>
					<h3 className="font-medium">User Management</h3>
					<p className="text-muted-foreground text-sm">
						View, ban, and manage user accounts
					</p>
				</a>
			</div>
		</div>
	);
}
