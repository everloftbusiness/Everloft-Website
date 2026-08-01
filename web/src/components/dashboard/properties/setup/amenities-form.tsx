"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { saveAmenitiesAction } from "@/features/properties/actions/onboarding.actions";

type Amenity = { id: string; name: string; category: string };

const CATEGORY_LABELS: Record<string, string> = {
  // Original 15 (still valid — some pre-existing items remain under these)
  internet: "Internet",
  entertainment: "Entertainment",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  safety: "Safety",
  family: "Family",
  accessibility: "Accessibility",
  outdoor: "Outdoor",
  parking: "Parking",
  heating: "Heating",
  cooling: "Cooling",
  laundry: "Laundry",
  workspace: "Workspace",
  smart_home: "Smart Home",
  // New 15 (docs/PROPERTY_SETUP_DASHBOARD_V2_IMPROVEMENTS.md §6)
  essentials: "Essentials",
  kitchen_dining: "Kitchen & Dining",
  internet_office: "Internet & Office",
  heating_cooling: "Heating & Cooling",
  safety_security: "Safety & Security",
  parking_building: "Parking & Building Facilities",
  guest_services: "Guest Services",
  pet_friendly: "Pet Friendly",
  views_location: "Views & Location",
};

export function AmenitiesForm({
  propertyId,
  allAmenities,
  selectedIds,
}: {
  propertyId: string;
  allAmenities: Amenity[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [search, setSearch] = useState("");

  const visibleAmenities = useMemo(() => {
    if (!search.trim()) return allAmenities;
    const q = search.trim().toLowerCase();
    return allAmenities.filter((a) => a.name.toLowerCase().includes(q));
  }, [allAmenities, search]);

  const grouped = visibleAmenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setStatus("saving");
    try {
      await saveAmenitiesAction(propertyId, Array.from(selected));
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{selected.size} amenities selected</p>
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search amenities..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      {visibleAmenities.length === 0 && <p className="text-sm text-muted-foreground">No amenities match &ldquo;{search}&rdquo;.</p>}
      {Object.entries(grouped).map(([category, amenities]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[category] ?? category} ({amenities.filter((a) => selected.has(a.id)).length} selected)
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm">
                <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <Button type="button" variant="gold" size="sm" onClick={handleSave} disabled={status === "saving"}>
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
            <AlertCircle className="h-3.5 w-3.5" /> Failed — try again
          </span>
        )}
      </div>
    </div>
  );
}
