"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePropertyAction } from "@/features/properties/actions/property.actions";

export function DeletePropertyButton({ propertyId, propertyName }: { propertyId: string; propertyName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${propertyName}"? This can be restored later by an admin, but it will disappear from lists immediately.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deletePropertyAction(propertyId);
      toast.success("Property deleted.");
      router.push("/dashboard/properties");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete this property.");
      setIsDeleting(false);
    }
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Delete Property"}
    </Button>
  );
}
