"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveDraftAction, publishPropertyAction } from "@/features/properties/actions/onboarding.actions";

export function SetupHeaderActions({ propertyId, canPublish, publicUrl }: { propertyId: string; canPublish: boolean; publicUrl?: string }) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleSaveDraft() {
    await saveDraftAction(propertyId);
    toast.success("Draft saved.");
    router.refresh();
  }

  async function handlePublish() {
    setIsPublishing(true);
    try {
      await publishPropertyAction(propertyId);
      toast.success("Property submitted for review.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to publish yet.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {publicUrl && (
        <Button asChild variant="outline" size="sm">
          <a href={publicUrl} target="_blank" rel="noreferrer">
            Preview Listing
          </a>
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleSaveDraft}>
        Save Draft
      </Button>
      <Button
        variant="gold"
        size="sm"
        onClick={handlePublish}
        disabled={!canPublish || isPublishing}
        title={canPublish ? undefined : "Complete all required sections first"}
      >
        {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Publish
      </Button>
    </div>
  );
}
