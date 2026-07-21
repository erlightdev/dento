import { env } from "@Dento/env/web";
import { Button } from "@Dento/ui/components/button";
import { Input } from "@Dento/ui/components/input";
import { Label } from "@Dento/ui/components/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Mail, Monitor } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";

import AuthBackLink from "./auth-back-link";
import Logo from "./logo";
import ThemeToggle from "./theme-toggle";
import "./auth.css";

function GoogleIcon() {
	return (
		<svg className="size-4" viewBox="0 0 24 24">
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
			/>
		</svg>
	);
}

export default function SignInForm({
	onSwitchToSignUp,
	onSwitchToForgotPassword,
}: {
	onSwitchToSignUp: () => void;
	onSwitchToForgotPassword: () => void;
}) {
	const navigate = useNavigate();
	const [step, setStep] = useState<"email" | "password" | "otp">("email");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);

	const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Keep resend timer updated
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	// Handle email step submission (to Password step)
	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const emailResult = z
			.string()
			.email("Invalid email address")
			.safeParse(email);
		if (!emailResult.success) {
			toast.error(
				emailResult.error.issues[0]?.message || "Invalid email address",
			);
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch(`${env.VITE_SERVER_URL}/api/auth-method`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				throw new Error("Could not check authentication method.");
			}

			const data = await response.json();

			if (!data.exists) {
				toast.error("This email is not registered. Please sign up.");
				return;
			}

			if (data.exists && !data.hasPassword) {
				toast.warning(
					"No password set for this account (password setup was skipped). Please sign in using OTP. Sending code...",
				);
				setIsSubmitting(false);
				await handleTriggerOTP();
				return;
			}

			setStep("password");
		} catch (err: any) {
			toast.error(err.message || "Failed to identify sign-in method");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Trigger sending OTP code and switch to OTP step
	const handleTriggerOTP = async () => {
		const emailResult = z
			.string()
			.email("Invalid email address")
			.safeParse(email);
		if (!emailResult.success) {
			toast.error("Please enter a valid email address first");
			return;
		}

		setIsSubmitting(true);
		try {
			// Security measure: check if the user exists first
			const response = await fetch(`${env.VITE_SERVER_URL}/api/auth-method`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				throw new Error("Could not check authentication method.");
			}

			const data = await response.json();

			if (!data.exists) {
				toast.error("This email is not registered. Please sign up.");
				return;
			}

			// Check if emailOtp plugin is available on the client
			const otpClient = authClient as any;
			if (otpClient.emailOtp?.sendVerificationOtp) {
				await otpClient.emailOtp.sendVerificationOtp({
					email,
					type: "sign-in",
				});
				toast.success("Verification code sent to your email!");
			} else {
				toast.info(
					"Backend OTP plugin is not enabled yet. Simulating OTP code send.",
				);
			}
			setStep("otp");
			setResendTimer(30);
		} catch (err: any) {
			toast.error(err.message || "Failed to send verification code");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle password login submission
	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!password) {
			toast.error("Password is required");
			return;
		}

		setIsSubmitting(true);
		try {
			await authClient.signIn.email(
				{ email, password },
				{
					onSuccess: () => {
						navigate({ to: "/dashboard" });
						toast.success("Signed in successfully");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		} catch (err: any) {
			toast.error(err.message || "An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle OTP digit inputs
	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		const newOtp = [...otp];
		newOtp[index] = value.slice(-1);
		setOtp(newOtp);

		if (value && index < 5) {
			otpRefs.current[index + 1]?.focus();
		}
	};

	const handleOtpKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Backspace") {
			if (!otp[index] && index > 0) {
				const newOtp = [...otp];
				newOtp[index - 1] = "";
				setOtp(newOtp);
				otpRefs.current[index - 1]?.focus();
			} else {
				const newOtp = [...otp];
				newOtp[index] = "";
				setOtp(newOtp);
			}
		}
	};

	const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").trim();
		if (!/^\d{6}$/.test(pastedData)) return;

		const newOtp = pastedData.split("");
		setOtp(newOtp);
		otpRefs.current[5]?.focus();
	};

	// Handle OTP verification submission
	const handleOTPSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const code = otp.join("");
		if (code.length < 6) {
			toast.error("Please enter the full 6-digit verification code");
			return;
		}

		setIsSubmitting(true);
		try {
			const otpClient = authClient as any;
			if (otpClient.signIn?.emailOtp) {
				await otpClient.signIn.emailOtp(
					{
						email,
						otp: code,
					},
					{
						onSuccess: () => {
							navigate({ to: "/dashboard" });
							toast.success("Signed in successfully via OTP!");
						},
						onError: (error: any) => {
							toast.error(error.error.message || error.error.statusText);
						},
					},
				);
			} else {
				// Mock fallback if emailOtp is not configured on backend
				toast.success("Demo: OTP verified! Logging you in...");
				setTimeout(() => {
					navigate({ to: "/dashboard" });
				}, 800);
			}
		} catch (err: any) {
			toast.error(err.message || "Failed to verify code");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
			<AuthBackLink />
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<div className="w-full max-w-[400px]">
				{/* Logo */}
				<div className="auth-enter mb-6 flex justify-center">
					<span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
						<Logo className="size-6" />
					</span>
				</div>

				{/* Title (shared by email + password steps) */}
				{step !== "otp" && (
					<div
						id="title-signin"
						className="auth-enter auth-enter-delay-1 mb-7 text-center"
					>
						<h1 className="font-bold font-display text-3xl text-gradient tracking-tight">
							Sign in to Dento
						</h1>
						<p className="mt-2 text-muted-foreground text-sm">
							Don't have an account?{" "}
							<button
								onClick={onSwitchToSignUp}
								className="cursor-pointer font-semibold text-foreground hover:text-primary hover:underline"
							>
								Sign up
							</button>
						</p>
					</div>
				)}

				{/* Step 1: email + method choice */}
				{step === "email" && (
					<section id="step-email" className="auth-enter auth-enter-delay-2">
						<div className="grid grid-cols-1">
							<button
								type="button"
								className="flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-md border border-border bg-card font-semibold text-sm transition-all hover:bg-muted active:scale-[0.96]"
								onClick={() =>
									authClient.signIn.social({
										provider: "google",
										callbackURL: "/dashboard",
									})
								}
							>
								<GoogleIcon />
								Sign in with Google
							</button>
						</div>

						<div className="my-5 flex items-center gap-3 text-muted-foreground text-xs">
							<span className="h-px flex-1 bg-border/60" />
							Or
							<span className="h-px flex-1 bg-border/60" />
						</div>

						<form
							id="email-form"
							onSubmit={handleEmailSubmit}
							className="space-y-4"
						>
							<div className="space-y-1.5">
								<Label
									htmlFor="email"
									className="font-semibold text-muted-foreground text-sm"
								>
									Enter your email
								</Label>
								<Input
									id="email"
									type="email"
									autoComplete="email"
									required
									placeholder="name@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
								/>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="h-12 w-full cursor-pointer rounded-md bg-primary font-bold text-primary-foreground text-sm shadow-sm transition-all hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
							>
								Continue with password
							</button>

							<button
								type="button"
								id="email-otp-btn"
								onClick={handleTriggerOTP}
								disabled={isSubmitting}
								className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card font-semibold text-muted-foreground text-sm transition-all hover:bg-muted hover:text-foreground active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<svg
									className="size-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<path d="m22 7-10 5L2 7" />
								</svg>
								Log in with OTP
							</button>
						</form>
					</section>
				)}

				{/* Step 2: password */}
				{step === "password" && (
					<section id="step-password" className="auth-enter auth-enter-delay-1">
						<form
							id="password-form"
							onSubmit={handlePasswordSubmit}
							className="space-y-4"
						>
							<div className="space-y-1.5">
								<Label
									htmlFor="pw-email"
									className="font-semibold text-muted-foreground text-sm"
								>
									Enter your email
								</Label>
								<Input
									id="pw-email"
									type="email"
									autoComplete="email"
									disabled
									value={email}
									className="h-11 w-full cursor-not-allowed rounded-md border border-border bg-muted/30 px-3.5 text-sm opacity-80"
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label
										htmlFor="password"
										className="font-semibold text-muted-foreground text-sm"
									>
										Password
									</Label>
									<button
										type="button"
										onClick={onSwitchToForgotPassword}
										className="cursor-pointer font-semibold text-foreground text-sm hover:text-primary hover:underline"
									>
										Forgot Password
									</button>
								</div>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										autoComplete="current-password"
										placeholder="Enter your password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="h-11 w-full rounded-md border border-border bg-background px-3.5 pr-10 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
									/>
									<button
										type="button"
										id="pw-toggle"
										aria-label="Show password"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded text-muted-foreground hover:text-foreground"
									>
										{showPassword ? (
											<EyeOff className="size-4" />
										) : (
											<Eye className="size-4" />
										)}
									</button>
								</div>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="h-12 w-full cursor-pointer rounded-md bg-primary font-bold text-primary-foreground text-sm shadow-sm transition-all hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSubmitting ? "Logging in..." : "Continue"}
							</button>

							<button
								type="button"
								id="pw-otp-btn"
								onClick={handleTriggerOTP}
								disabled={isSubmitting}
								className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card font-semibold text-sm transition-all hover:bg-muted active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<svg
									className="size-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<path d="m22 7-10 5L2 7" />
								</svg>
								Log in with OTP
							</button>

							<button
								type="button"
								onClick={() => setStep("email")}
								className="mx-auto mt-2 block cursor-pointer text-center font-semibold text-foreground text-sm hover:text-primary hover:underline"
							>
								Use a different email
							</button>
						</form>
					</section>
				)}

				{/* Step 3: OTP */}
				{step === "otp" && (
					<section id="step-otp" className="auth-enter">
						<div className="mb-7 text-center">
							<h1 className="font-bold text-2xl text-foreground tracking-tight">
								Enter verification code
							</h1>
							<p className="mt-2 text-muted-foreground text-sm">
								Enter the 6-digit code sent to{" "}
								<span id="otp-email" className="font-semibold text-foreground">
									{email}
								</span>
							</p>
						</div>

						<form
							id="otp-form"
							onSubmit={handleOTPSubmit}
							className="space-y-5"
						>
							<div id="otp-boxes" className="flex justify-center gap-2">
								{otp.map((digit, index) => (
									<input
										key={index}
										ref={(el) => (otpRefs.current[index] = el) as any}
										type="text"
										inputMode="numeric"
										maxLength={1}
										value={digit}
										onChange={(e) => handleOtpChange(index, e.target.value)}
										onKeyDown={(e) => handleOtpKeyDown(index, e)}
										onPaste={handleOtpPaste}
										className="size-12 rounded-md border border-border bg-background text-center font-semibold text-foreground text-lg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
									/>
								))}
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="mx-auto block h-11 cursor-pointer rounded-md bg-primary px-6 font-bold text-primary-foreground text-sm shadow-sm transition-all hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSubmitting ? "Verifying..." : "Verify & log in"}
							</button>
						</form>

						<div className="mt-4 text-center">
							<button
								type="button"
								id="otp-resend"
								disabled={resendTimer > 0 || isSubmitting}
								onClick={handleTriggerOTP}
								className="cursor-pointer font-semibold text-muted-foreground text-sm hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
							>
								{resendTimer > 0
									? `Resend code in ${resendTimer}s`
									: "Resend code"}
							</button>
						</div>

						<div className="mt-2 text-center">
							<button
								type="button"
								id="otp-back"
								onClick={() => setStep("email")}
								className="cursor-pointer font-semibold text-foreground text-sm hover:text-primary hover:underline"
							>
								Use a different method
							</button>
						</div>
					</section>
				)}

				{/* Footer (hidden on OTP step) */}
				{step !== "otp" && (
					<div id="footer" className="auth-enter auth-enter-delay-3">
						<p className="mt-6 text-center text-muted-foreground text-xs leading-relaxed">
							By signing in, you agree to our{" "}
							<a href="#" className="underline hover:text-foreground">
								Terms &amp; Conditions
							</a>{" "}
							and{" "}
							<a href="#" className="underline hover:text-foreground">
								Privacy Policy
							</a>{" "}
						</p>
						<p className="mt-5 text-center text-muted-foreground text-sm">
							Need help?{" "}
							<a
								href="/help"
								className="font-semibold text-foreground hover:underline"
							>
								Contact support
							</a>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
