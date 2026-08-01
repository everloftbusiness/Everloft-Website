"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

const schema = z.object({ email: z.string().min(1, "Email is required.").email("Enter a valid email address.") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    // Always show success, even for unknown emails — prevents account enumeration.
    setSent(true);
  }

  return (
    <div className="site-container flex min-h-[85vh] items-center justify-center pt-28 pb-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-10">
        <Logo className="mb-8" />
        {sent ? (
          <div className="text-center">
            <Mail className="mx-auto mb-4 h-10 w-10 text-gold" />
            <h1 className="text-xl font-bold text-primary">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for that email, a password reset link is on its way.
            </p>
            <Button asChild variant="ghost" size="lg" className="mt-6 w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-primary">Reset your password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter the email tied to your Everloft account and we&apos;ll send a reset link.
              </p>
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5">Email</Label>
              <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={!!errors.email} {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" variant="gold" size="xl" className="w-full rounded-xl" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
