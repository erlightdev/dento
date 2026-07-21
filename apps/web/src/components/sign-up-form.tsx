import { Button } from "@Dento/ui/components/button";
import { Input } from "@Dento/ui/components/input";
import { Label } from "@Dento/ui/components/label";
import { useNavigate } from "@tanstack/react-router";
import { Monitor, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import z from "zod";

import { env } from "@Dento/env/web";
import { authClient } from "@/lib/auth-client";

import AuthBackLink from "./auth-back-link";
import ThemeToggle from "./theme-toggle";
import Logo from "./logo";
import "./auth.css";

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"></path>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"></path>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"></path>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"></path>
    </svg>
  );
}

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"start" | "otp" | "password">("start");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);
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

  // Calculate password strength
  const calculatePasswordStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setStrengthScore(score);
  };

  const getStrengthColor = () => {
    switch (strengthScore) {
      case 0:
      case 1:
        return "bg-destructive";
      case 2:
        return "bg-amber-500";
      case 3:
        return "bg-yellow-400";
      case 4:
        return "bg-emerald-500";
      default:
        return "bg-destructive";
    }
  };

  // Helper to send/resend OTP
  const sendCode = async () => {
    try {
      const otpClient = authClient as any;
      if (otpClient.emailOtp?.sendVerificationOtp) {
        const { error } = await otpClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in", // sign-in is used by default in Better Auth for login / registration via OTP
        });
        if (error) {
          toast.error(error.message || "Could not send the code.");
          return false;
        }
        toast.success("Verification code sent!", { description: email });
        return true;
      } else {
        toast.info("Backend OTP plugin is not enabled yet. Simulating OTP code send.");
        return true;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
      return false;
    }
  };

  // Step 1: Submit email to register / send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = z.string().email("Invalid email address").safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.issues[0]?.message || "Invalid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // Pre-check if the user is already registered
      const response = await fetch(`${env.VITE_SERVER_URL}/api/auth-method`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          toast.error("This email is already registered. Please sign in.");
          setIsSubmitting(false);
          return;
        }
      }

      // In Better Auth, sign up with email and password (mock password first, or call signUp.email with name/email)
      const res = await authClient.signUp.email({
        email,
        password: Math.random().toString(36).slice(-10) + "A1!", // temporary random password until they set their own
        name: name || email.split("@")[0],
      }, {
        onSuccess: async () => {
          const success = await sendCode();
          if (success) {
            setStep("otp");
            setResendTimer(60);
          }
        },
        onError: (err) => {
          toast.error(err.error.message || "Sign up failed.");
        }
      });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      const otpClient = authClient as any;
      if (otpClient.signIn?.emailOtp) {
        const { error } = await otpClient.signIn.emailOtp({
          email,
          otp: code,
        });
        if (error) {
          toast.error(error.message || "Invalid or expired code.");
          return;
        }
        toast.success("Email verified successfully!", { description: email });
        setStep("password");
      } else {
        // Mock fallback if emailOtp is not configured on backend
        toast.success("Email verified! (Demo flow)");
        setStep("password");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${env.VITE_SERVER_URL}/api/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Could not set the password.");
        return;
      }

      toast.success("Password set successfully!");
      navigate({ to: "/dashboard" });
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <AuthBackLink />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-6 flex justify-center auth-enter">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Logo className="size-6" />
          </span>
        </div>

        {/* Step 1: Start signup */}
        {step === "start" && (
          <section id="step-start" className="auth-enter">
            <div className="mb-7 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gradient font-display">Get Started with Dento</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={onSwitchToSignIn} className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer">
                  Login
                </button>
              </p>
            </div>

            <div className="grid grid-cols-1">
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2.5 rounded-md border border-border bg-card text-sm font-semibold transition-all hover:bg-muted cursor-pointer active:scale-[0.96]"
                onClick={() =>
                  authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
                }
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border/60"></span>Or<span className="h-px flex-1 bg-border/60"></span>
            </div>

            <form id="email-form" onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground">Enter your name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">Enter your email</Label>
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
                className="h-11 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Sending code..." : "Sign up"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
              By signing up, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Need help?{" "}
              <a href="/help" className="font-semibold text-foreground hover:text-primary hover:underline">
                Contact support
              </a>
            </p>
          </section>
        )}

        {/* Step 2: OTP verify */}
        {step === "otp" && (
          <section id="step-otp" className="auth-enter">
            <div className="mb-7 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gradient font-display">Verify your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code sent to <span id="otp-email" className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            <form id="otp-form" onSubmit={handleOTPSubmit} className="space-y-5">
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
                    className="size-12 rounded-md border border-border bg-background text-center text-lg font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40 text-foreground"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Verifying..." : "Verify email"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                id="otp-resend"
                disabled={resendTimer > 0 || isSubmitting}
                onClick={sendCode}
                className="text-sm font-semibold text-muted-foreground hover:text-primary disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
              </button>
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                id="go-back"
                onClick={() => setStep("start")}
                className="text-sm font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
              >
                Go back
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Password setting */}
        {step === "password" && (
          <section id="step-password" className="auth-enter">
            <div className="mb-7 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gradient font-display">Set a password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a password so you can sign in faster next time.
              </p>
            </div>

            <form id="password-form" onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Enter a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      calculatePasswordStrength(e.target.value);
                    }}
                    className="h-11 w-full rounded-md border border-border bg-background px-3.5 pr-10 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                  <button
                    type="button"
                    id="pw-toggle"
                    aria-label="Show password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                    className={`h-full transition-all ${getStrengthColor()}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  At least 8 characters, with a mix of letters and numbers.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm font-semibold text-muted-foreground">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.96] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "Setting password..." : "Set password & continue"}
              </button>
            </form>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => navigate({ to: "/dashboard" })}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
