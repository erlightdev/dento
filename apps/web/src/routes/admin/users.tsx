import { Button } from "@Dento/ui/components/button";
import { Input } from "@Dento/ui/components/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/users")({
	component: AdminUsersPage,
});

function AdminUsersPage() {
	const [search, setSearch] = useState("");
	const queryClient = useQueryClient();

	const usersQuery = useQuery(
		orpc.admin.listUsers.queryOptions({
			input: { search: search || undefined },
		}),
	);

	const banMutation = useMutation(
		orpc.admin.banUser.mutationOptions({
			onSuccess: () => {
				toast.success("User banned");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.listUsers.queryKey({}),
				});
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const unbanMutation = useMutation(
		orpc.admin.unbanUser.mutationOptions({
			onSuccess: () => {
				toast.success("User unbanned");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.listUsers.queryKey({}),
				});
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const roleMutation = useMutation(
		orpc.admin.setRole.mutationOptions({
			onSuccess: () => {
				toast.success("Role updated");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.listUsers.queryKey({}),
				});
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.deleteUser.mutationOptions({
			onSuccess: () => {
				toast.success("User deleted");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.listUsers.queryKey({}),
				});
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	const users = usersQuery.data?.users ?? [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl">Users</h1>
				<div className="flex items-center gap-2">
					<Input
						placeholder="Search by email..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-64"
					/>
				</div>
			</div>

			{usersQuery.isLoading ? (
				<p className="text-muted-foreground">Loading...</p>
			) : users.length === 0 ? (
				<p className="text-muted-foreground">No users found.</p>
			) : (
				<div className="rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="p-3 text-left font-medium">Name</th>
								<th className="p-3 text-left font-medium">Email</th>
								<th className="p-3 text-left font-medium">Role</th>
								<th className="p-3 text-left font-medium">Status</th>
								<th className="p-3 text-left font-medium">Verified</th>
								<th className="p-3 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.id} className="border-b last:border-0">
									<td className="p-3">{u.name}</td>
									<td className="p-3 text-muted-foreground">{u.email}</td>
									<td className="p-3">
										<span
											className={`inline-block rounded-full px-2 py-0.5 font-medium text-xs ${
												u.role === "admin"
													? "bg-purple-100 text-purple-700"
													: "bg-gray-100 text-gray-700"
											}`}
										>
											{u.role}
										</span>
									</td>
									<td className="p-3">
										{u.banned ? (
											<span className="inline-block rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 text-xs">
												Banned
												{u.banReason && (
													<span className="ml-1 text-red-500">
														({u.banReason})
													</span>
												)}
											</span>
										) : (
											<span className="inline-block rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 text-xs">
												Active
											</span>
										)}
									</td>
									<td className="p-3">
										{u.emailVerified ? (
											<span className="text-green-600">Yes</span>
										) : (
											<span className="text-yellow-600">No</span>
										)}
									</td>
									<td className="p-3 text-right">
										<div className="flex justify-end gap-1">
											{u.banned ? (
												<Button
													size="sm"
													variant="outline"
													onClick={() => unbanMutation.mutate({ userId: u.id })}
													disabled={unbanMutation.isPending}
												>
													Unban
												</Button>
											) : (
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														const reason = prompt("Ban reason:");
														if (reason) {
															banMutation.mutate({
																userId: u.id,
																reason,
															});
														}
													}}
													disabled={banMutation.isPending}
												>
													Ban
												</Button>
											)}
											{u.role === "user" ? (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														roleMutation.mutate({
															userId: u.id,
															role: "admin",
														})
													}
													disabled={roleMutation.isPending}
												>
													Make Admin
												</Button>
											) : (
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														roleMutation.mutate({
															userId: u.id,
															role: "user",
														})
													}
													disabled={roleMutation.isPending}
												>
													Remove Admin
												</Button>
											)}
											<Button
												size="sm"
												variant="destructive"
												onClick={() => {
													if (
														confirm(
															`Delete user ${u.email}? This cannot be undone.`,
														)
													) {
														deleteMutation.mutate({ userId: u.id });
													}
												}}
												disabled={deleteMutation.isPending}
											>
												Delete
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{usersQuery.data?.total !== undefined && (
				<p className="text-muted-foreground text-sm">
					Total: {usersQuery.data.total} users
				</p>
			)}
		</div>
	);
}
