import { Button } from "@Dento/ui/components/button";
import { Input } from "@Dento/ui/components/input";
import { Label } from "@Dento/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle, Monitor } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import AuthBackLink from "./auth-back-link";
import Logo from "./logo";
import ThemeToggle from "./theme-toggle";
import "./auth.css";

export default function ResetPasswordForm() {
	const navigate = useNavigate();
	const { token } = useSearch({ from: "/reset-password" });
	const [done, setDone] = useState(false);

	const form = useForm({
		defaultValues: { password: "", confirmPassword: "" },
		onSubmit: async ({ value }) => {
			await authClient.resetPassword(
				{ newPassword: value.password, token },
				{
					onSuccess: () => {
						setDone(true);
						toast.success("Password reset successfully");
					},
					onError: (error: {
						error: { message?: string; statusText?: string };
					}) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z
				.object({
					password: z.string().min(8, "Password must be at least 8 characters"),
					confirmPassword: z.string(),
				})
				.refine((data) => data.password === data.confirmPassword, {
					message: "Passwords don't match",
					path: ["confirmPassword"],
				}),
		},
	});

	if (done) {
		return (
			<div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
				<AuthBackLink />
				<div className="absolute top-4 right-4">
					<ThemeToggle />
				</div>
				<div className="flex w-full max-w-[400px] flex-col items-center">
					<div className="auth-enter mb-6 flex size-12 items-center justify-center rounded-full bg-primary shadow-sm">
						<CheckCircle className="size-5 text-primary-foreground" />
					</div>
					<h1
						className="auth-enter auth-enter-delay-1 mb-2 text-center font-bold font-display text-3xl text-gradient tracking-tight"
						style={{ textWrap: "balance" }}
					>
						Password reset complete
					</h1>
					<p className="auth-enter auth-enter-delay-2 mb-8 text-center font-sans text-muted-foreground text-sm">
						Your password has been updated. Sign in with your new password.
					</p>
					<Button
						className="auth-enter auth-enter-delay-3 h-10 w-full rounded-md bg-primary font-bold text-primary-foreground text-sm shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.96]"
						onClick={() => navigate({ to: "/login" })}
					>
						Sign in
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
			<AuthBackLink />
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<div className="flex w-full max-w-[400px] flex-col items-center">
				<div className="auth-enter mb-6 flex size-12 items-center justify-center rounded-full bg-primary shadow-sm">
					<Logo className="size-6 text-primary-foreground" />
				</div>
				<h1
					className="auth-enter auth-enter-delay-1 mb-2 text-center font-bold font-display text-3xl text-gradient tracking-tight"
					style={{ textWrap: "balance" }}
				>
					Set new password
				</h1>
				<p className="auth-enter auth-enter-delay-1 mb-8 text-center font-sans text-muted-foreground text-sm">
					Enter your new password below.
				</p>

				<div className="auth-enter auth-enter-delay-2 glass w-full rounded-md p-6 shadow-sm">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="flex flex-col gap-3.5"
					>
						<form.Field name="password">
							{(field) => {
								const errors = field.state.meta.errors
									.map((e) => e?.message)
									.filter((m): m is string => Boolean(m));
								return (
									<div className="flex flex-col gap-1.5">
										<Label
											htmlFor={field.name}
											className="font-semibold text-muted-foreground text-xs"
										>
											New password
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											autoComplete="new-password"
											aria-invalid={errors.length > 0}
											placeholder="Enter new password"
											className="h-10 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-primary/20"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{errors.map((err) => (
											<p key={err} className="text-red-400 text-xs">
												{err}
											</p>
										))}
									</div>
								);
							}}
						</form.Field>

						<form.Field name="confirmPassword">
							{(field) => {
								const errors = field.state.meta.errors
									.map((e) => e?.message)
									.filter((m): m is string => Boolean(m));
								return (
									<div className="flex flex-col gap-1.5">
										<Label
											htmlFor={field.name}
											className="font-semibold text-muted-foreground text-xs"
										>
											Confirm password
										</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											autoComplete="new-password"
											aria-invalid={errors.length > 0}
											placeholder="Confirm new password"
											className="h-10 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-primary/20"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{errors.map((err) => (
											<p key={err} className="text-red-400 text-xs">
												{err}
											</p>
										))}
									</div>
								);
							}}
						</form.Field>

						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button
									type="submit"
									className="mt-1 h-10 w-full rounded-md bg-primary font-bold text-primary-foreground text-sm shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.96]"
									disabled={!canSubmit || isSubmitting}
								>
									{isSubmitting ? "Resetting..." : "Reset password"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</div>
			</div>
		</div>
	);
}
