"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SectionFormShell({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<{ ok: boolean } | void>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("saving");
    setError("");
    try {
      await action(formData);
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {children}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="gold" size="sm" disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </Button>
        {status === "saved" && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        {status === "failed" && (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> {error || "Failed — try again"}
          </span>
        )}
      </div>
    </form>
  );
}
