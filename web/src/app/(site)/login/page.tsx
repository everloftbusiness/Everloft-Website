"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, LineChart, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";

const BENEFITS = [
  { icon: ShieldCheck, text: "Role-based session access" },
  { icon: LineChart, text: "Performance and asset visibility" },
  { icon: FileText, text: "Reports, payouts, and document access" },
];

const loginSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });
  const rememberMe = useWatch({ control, name: "rememberMe" });

  async function onSubmit(values: LoginValues) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to login right now.");
      toast.success(`Welcome, ${data.name}`);
      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Unable to login right now.");
    }
  }

  return (
    <div className="site-container flex min-h-[85vh] items-center pt-28 pb-16">
      <div className="mx-auto grid w-full max-w-4xl gap-0 overflow-hidden rounded-2xl border border-border md:grid-cols-2">
        <div className="bg-primary p-10 text-white">
          <Logo variant="light" className="mb-8" />
          <h1 className="text-2xl font-bold leading-tight">Welcome back</h1>
          <p className="mt-3 text-white/70">
            Sign in to continue to the Everloft platform.
          </p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm text-white/80">
                <b.icon className="h-4 w-4 shrink-0 text-gold" />
                {b.text}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 bg-card p-10">
          <div>
            <Label htmlFor="email" className="mb-1.5">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", checked === true)}
            />
            Remember me
          </label>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" variant="gold" size="xl" className="w-full rounded-xl" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}
