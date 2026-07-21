import { Button } from "@Dento/ui/components/button";
import { Input } from "@Dento/ui/components/input";
import { Label } from "@Dento/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Mail, Monitor } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import AuthBackLink from "./auth-back-link";
import ThemeToggle from "./theme-toggle";
import "./auth.css";

export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      await authClient.requestPasswordReset(
        { email: value.email, redirectTo: "/reset-password" },
        {
          onSuccess: () => setSent(true),
          onError: (error: { error: { message?: string; statusText?: string } }) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({ email: z.email("Invalid email address") }),
    },
  });

  if (sent) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
        <AuthBackLink />
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="flex w-full max-w-[400px] flex-col items-center">
          <div className="auth-enter mb-6 flex size-12 items-center justify-center rounded-full bg-primary shadow-sm">
            <Mail className="size-5 text-primary-foreground" />
          </div>
          <h1 className="auth-enter auth-enter-delay-1 mb-2 text-center text-3xl font-bold tracking-tight text-gradient font-display" style={{ textWrap: "balance" }}>
            Check your email
          </h1>
          <p className="auth-enter auth-enter-delay-2 mb-8 text-center text-sm leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
            We sent a password reset link to your email. Please check your inbox and follow the instructions.
          </p>
          <Button
            variant="outline"
            className="auth-enter auth-enter-delay-3 h-10 w-full cursor-pointer rounded-md border-border bg-background text-sm font-semibold text-foreground transition-all duration-150 hover:bg-muted/50 active:scale-[0.96] disabled:cursor-not-allowed"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <AuthBackLink />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-[400px] flex-col items-center">
        <div className="auth-enter mb-6 flex size-12 items-center justify-center rounded-full bg-primary shadow-sm">
          <Monitor className="size-5 text-primary-foreground" />
        </div>
        <h1 className="auth-enter auth-enter-delay-1 mb-2 text-center text-3xl font-bold tracking-tight text-gradient font-display" style={{ textWrap: "balance" }}>
          Reset your password
        </h1>
        <p className="auth-enter auth-enter-delay-1 mb-8 text-center text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        <div className="auth-enter auth-enter-delay-2 w-full rounded-md glass p-6 shadow-sm">
          <form
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
            className="flex flex-col gap-3.5"
          >
            <form.Field name="email">
              {(field) => {
                const errors = field.state.meta.errors.map((e) => e?.message).filter((m): m is string => Boolean(m));
                return (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={field.name} className="text-xs font-semibold text-muted-foreground">Email address</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      aria-invalid={errors.length > 0}
                      placeholder="name@email.com"
                      className="h-10 rounded-md border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-primary/20"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {errors.map((err) => (
                      <p key={err} className="text-xs text-red-400">{err}</p>
                    ))}
                  </div>
                );
              }}
            </form.Field>

            <form.Subscribe
              selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  className="mt-1 h-10 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.96] disabled:cursor-not-allowed"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>

        <Button
          variant="ghost"
          className="auth-enter auth-enter-delay-3 mt-4 h-10 cursor-pointer gap-2 bg-background text-sm font-semibold text-muted-foreground transition-colors duration-150 hover:bg-muted/50 hover:text-foreground border border-border/50 rounded-md active:scale-[0.96]"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
