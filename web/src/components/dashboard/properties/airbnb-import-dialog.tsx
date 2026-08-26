"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importAirbnbPropertyAction } from "@/features/properties/actions/airbnb-import.actions";

interface AirbnbImportDialogProps {
  targetPropertyId?: string;
  trigger?: React.ReactNode;
  onSuccess?: (propertyId: string) => void;
}

export function AirbnbImportDialog({
  targetPropertyId,
  trigger,
  onSuccess,
}: AirbnbImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const [progressMsg, setProgressMsg] = useState("Fetching Airbnb listing details...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ photos: number; amenities: number } | null>(null);

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMsg("Please enter an Airbnb listing URL.");
      return;
    }

    if (!trimmed.includes("airbnb.") && !trimmed.includes("abnb.me")) {
      setErrorMsg("Please enter a valid Airbnb URL (e.g. https://www.airbnb.com/rooms/12345678).");
      return;
    }

    setErrorMsg(null);
    setStatus("fetching");
    setProgressMsg("Connecting to Airbnb & extracting property details...");

    // Step indicators
    const t1 = setTimeout(() => setProgressMsg("Processing listing metadata, specs & amenities..."), 2500);
    const t2 = setTimeout(() => setProgressMsg("Downloading gallery photos & saving to Everloft CDN..."), 5000);
    const t3 = setTimeout(() => setProgressMsg("Finalizing property setup dashboard..."), 9000);

    try {
      const res = await importAirbnbPropertyAction(trimmed, targetPropertyId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (!res.success || !res.propertyId) {
        setStatus("error");
        setErrorMsg(res.error || "Failed to import property. Please verify the Airbnb URL is active.");
        return;
      }

      setStatus("success");
      setResultSummary({
        photos: res.importedPhotosCount || 0,
        amenities: res.importedAmenitiesCount || 0,
      });

      setTimeout(() => {
        setOpen(false);
        if (onSuccess) onSuccess(res.propertyId!);
        else router.push(`/dashboard/properties/${res.propertyId}/setup`);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred during import.");
    }
  }

  function handleOpenChange(val: boolean) {
    if (status === "fetching") return;
    setOpen(val);
    if (!val) {
      setUrl("");
      setStatus("idle");
      setErrorMsg(null);
      setResultSummary(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Import via Airbnb Link</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Link2 className="h-5 w-5" />
            </div>
            <span>{targetPropertyId ? "Import Airbnb Data to Property" : "Add Property via Airbnb Link"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Paste any public Airbnb listing link to automatically fetch and pre-fill property title, description, photos, bedrooms, bathrooms, guest count, location, and amenities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Input & Form */}
          {status !== "fetching" && status !== "success" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Airbnb Listing Link</label>
                <div className="relative">
                  <Input
                    placeholder="https://www.airbnb.com/rooms/12345678"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="h-10 text-xs pl-3 pr-9 bg-background"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Sample helper links */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[11px] space-y-1">
                <p className="font-semibold text-muted-foreground">Supported Formats:</p>
                <p className="text-muted-foreground font-mono text-[10px]">
                  • https://www.airbnb.com/rooms/12345678<br />
                  • https://airbnb.co.in/rooms/891234?guests=1
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleImport}
                  disabled={!url.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Fetch & Create Property
                </Button>
              </div>
            </div>
          )}

          {/* Loading / Fetching State */}
          {status === "fetching" && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30">
                <Loader2 className="h-7 w-7 animate-spin text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Importing Airbnb Listing...</p>
                <p className="text-xs text-muted-foreground animate-pulse">{progressMsg}</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Listing Successfully Imported!</p>
                <p className="text-xs text-muted-foreground">
                  Extracted {resultSummary?.photos || 0} photos &amp; {resultSummary?.amenities || 0} amenities. Redirecting to setup...
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center text-xs font-semibold text-emerald-600 gap-1">
                <span>Opening Property Setup</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
