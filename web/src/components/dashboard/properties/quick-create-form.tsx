"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createDraftPropertyAction } from "@/features/properties/actions/property.actions";

// "Add Property" is deliberately just this one field — everything else
// (type, location, specs, photos, pricing, ...) is filled in through the
// Setup Dashboard right after, not a big form up front. See
// docs/PROPERTY_ONBOARDING_EXPERIENCE.md.
export function QuickCreatePropertyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsSubmitting(true);
    try {
      const { id } = await createDraftPropertyAction(formData);
      router.push(`/dashboard/properties/${id}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="name" className="mb-1.5">
          Property Name
        </Label>
        <Input id="name" name="name" required autoFocus placeholder="e.g. Ocean View Villa" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          You&apos;ll fill in location, photos, pricing, and everything else on the next screen.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="gold" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Start Setup
      </Button>
    </form>
  );
}
