"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: Values) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to reset password.");
      toast.success("Password updated. Please sign in again.");
      router.push("/login");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Unable to reset password.");
    }
  }

  return (
    <div className="site-container flex min-h-[85vh] items-center justify-center pt-28 pb-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-10">
        <Logo className="mb-8" />
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-primary">Set a new password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This link is single-use — choose a new password to finish resetting your account.
            </p>
          </div>
          <div>
            <Label htmlFor="password" className="mb-1.5">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" autoFocus aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="mb-1.5">Confirm new password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" variant="gold" size="xl" className="w-full rounded-xl" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
