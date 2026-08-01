"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LookupOption, OwnerOption, PropertyDetail } from "@/features/properties/types/property.types";

type Props = {
  action: (formData: FormData) => Promise<{ id: string }>;
  lookups: { types: LookupOption[]; statuses: LookupOption[]; categories: LookupOption[] };
  owners: OwnerOption[];
  submitLabel: string;
  initialValues?: Partial<PropertyDetail>;
};

// Edit-only now — "Add Property" creates a minimal draft
// (quick-create-form.tsx) and jumps straight into the Setup Dashboard
// instead of using this fuller form.
export function PropertyForm({ action, lookups, owners, submitLabel, initialValues }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsSubmitting(true);
    try {
      await action(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
      return;
    }
    toast.success("Saved.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="name" className="mb-1.5">
          Property Name
        </Label>
        <Input id="name" name="name" required defaultValue={initialValues?.name} />
      </div>

      <div>
        <Label htmlFor="typeId" className="mb-1.5">
          Property Type
        </Label>
        <Select name="typeId" required defaultValue={initialValues?.typeId ?? undefined}>
          <SelectTrigger id="typeId" className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {lookups.types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="statusId" className="mb-1.5">
          Status
        </Label>
        <Select name="statusId" required defaultValue={initialValues?.statusId ?? undefined}>
          <SelectTrigger id="statusId" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {lookups.statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="categoryId" className="mb-1.5">
          Category
        </Label>
        <Select name="categoryId" defaultValue={initialValues?.categoryId ?? undefined}>
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            {lookups.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ownerId" className="mb-1.5">
          Owner
        </Label>
        <Select name="ownerId" defaultValue={initialValues?.ownerId ?? undefined}>
          <SelectTrigger id="ownerId" className="w-full">
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="country" className="mb-1.5">
          Country
        </Label>
        <Input id="country" name="country" required defaultValue={initialValues?.country ?? "India"} />
      </div>

      <div>
        <Label htmlFor="state" className="mb-1.5">
          State
        </Label>
        <Input id="state" name="state" defaultValue={initialValues?.state ?? undefined} />
      </div>

      <div>
        <Label htmlFor="city" className="mb-1.5">
          City
        </Label>
        <Input id="city" name="city" required defaultValue={initialValues?.city ?? undefined} />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="address" className="mb-1.5">
          Address
        </Label>
        <Input id="address" name="address" defaultValue={initialValues?.address ?? undefined} />
      </div>

      <div>
        <Label htmlFor="maxGuests" className="mb-1.5">
          Max Guests
        </Label>
        <Input id="maxGuests" name="maxGuests" type="number" min={1} defaultValue={initialValues?.maxGuests ?? undefined} />
      </div>

      <div>
        <Label htmlFor="bedrooms" className="mb-1.5">
          Bedrooms
        </Label>
        <Input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={initialValues?.bedrooms ?? undefined} />
      </div>

      <div>
        <Label htmlFor="bathrooms" className="mb-1.5">
          Bathrooms
        </Label>
        <Input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={initialValues?.bathrooms ?? undefined} />
      </div>

      <div>
        <Label htmlFor="currency" className="mb-1.5">
          Currency
        </Label>
        <Input id="currency" name="currency" defaultValue={initialValues?.currency ?? "INR"} maxLength={3} />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="description" className="mb-1.5">
          Description
        </Label>
        <Textarea id="description" name="description" rows={4} defaultValue={initialValues?.description ?? undefined} />
      </div>

      {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" variant="gold" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
