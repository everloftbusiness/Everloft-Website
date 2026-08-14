"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle, Search, Plus, Sparkles, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveAmenitiesAction, addCustomAmenityAction, deleteCustomAmenityAction } from "@/features/properties/actions/onboarding.actions";

type Amenity = { id: string; name: string; category: string; isCustom?: boolean };

const CATEGORY_LABELS: Record<string, string> = {
  internet: "Internet",
  entertainment: "Entertainment & Games",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  safety: "Safety",
  family: "Family",
  accessibility: "Accessibility",
  outdoor: "Outdoor & Leisure",
  parking: "Parking",
  heating: "Heating",
  cooling: "Cooling",
  laundry: "Laundry & Utility",
  workspace: "Workspace",
  smart_home: "Smart Home",
  essentials: "Essentials",
  kitchen_dining: "Kitchen & Dining",
  internet_office: "Internet & Office",
  heating_cooling: "Heating & Cooling",
  safety_security: "Safety & Security",
  parking_building: "Parking & Building Facilities",
  guest_services: "Guest Services & Wellness",
  pet_friendly: "Pet Friendly",
  views_location: "Views & Location",
};

export function AmenitiesForm({
  propertyId,
  allAmenities: initialAmenities,
  selectedIds,
}: {
  propertyId: string;
  allAmenities: Amenity[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>(initialAmenities);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [search, setSearch] = useState("");

  // Custom Amenity Creator State
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("entertainment");
  const [isAddingAmenity, setIsAddingAmenity] = useState(false);

  const visibleAmenities = useMemo(() => {
    if (!search.trim()) return amenitiesList;
    const q = search.trim().toLowerCase();
    return amenitiesList.filter((a) => a.name.toLowerCase().includes(q));
  }, [amenitiesList, search]);

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

  async function handleAddCustomAmenity() {
    const trimmed = customName.trim();
    if (!trimmed) return;
    setIsAddingAmenity(true);
    try {
      await addCustomAmenityAction(propertyId, trimmed, customCategory);
      const tempId = `custom_rule_${trimmed}`;
      setAmenitiesList((prev) => [...prev, { id: tempId, name: trimmed, category: customCategory, isCustom: true }]);
      setSelected((prev) => new Set([...prev, tempId]));
      setCustomName("");
      setIsAddingCustom(false);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsAddingAmenity(false);
    }
  }

  async function handleDeleteCustomAmenity(amenityId: string, amenityName: string) {
    try {
      await deleteCustomAmenityAction(propertyId, amenityId);
      setAmenitiesList((prev) => prev.filter((a) => a.id !== amenityId && a.name !== amenityName));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(amenityId);
        return next;
      });
      router.refresh();
    } catch {
      // ignore
    }
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
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            {selected.size} Amenities Selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingCustom((prev) => !prev)}
            className="h-8 text-xs border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Amenity</span>
          </Button>
        </div>

        <div className="relative w-56 sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search amenities (e.g. WiFi, Pool)..."
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Dynamic Custom Amenity Creator Modal/Card */}
      {isAddingCustom && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Add Custom Amenity (e.g. PS5 Gaming Console, Heated Jacuzzi, Private Chef)
            </p>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <Input
              placeholder="Amenity name (e.g. PS5 Console, Foosball, Karaoke Mic, Projector)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-8 text-xs bg-background flex-1"
            />
            <Select value={customCategory} onValueChange={setCustomCategory}>
              <SelectTrigger className="h-8 w-48 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entertainment" className="text-xs">Entertainment & Games</SelectItem>
                <SelectItem value="outdoor" className="text-xs">Outdoor & Leisure</SelectItem>
                <SelectItem value="guest_services" className="text-xs">Guest Services & Wellness</SelectItem>
                <SelectItem value="kitchen_dining" className="text-xs">Kitchen & Dining</SelectItem>
                <SelectItem value="bedroom" className="text-xs">Bedroom</SelectItem>
                <SelectItem value="bathroom" className="text-xs">Bathroom</SelectItem>
                <SelectItem value="workspace" className="text-xs">Workspace</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomAmenity}
              disabled={isAddingAmenity || !customName.trim()}
              className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0"
            >
              {isAddingAmenity ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Add Amenity
            </Button>
          </div>
        </div>
      )}

      {visibleAmenities.length === 0 && (
        <p className="text-sm text-muted-foreground">No amenities match &ldquo;{search}&rdquo;.</p>
      )}

      {Object.entries(grouped).map(([category, amenities]) => (
        <div key={category} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>{CATEGORY_LABELS[category] ?? category}</span>
            <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400">
              {amenities.filter((a) => selected.has(a.id)).length} / {amenities.length} selected
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => {
              const isChecked = selected.has(a.id);
              const isCustomItem = a.isCustom || a.id.startsWith("custom_");
              return (
                <div
                  key={a.id}
                  className={`group flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                    isChecked
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-semibold"
                      : "border-border bg-card text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                    <Checkbox checked={isChecked} onCheckedChange={() => toggle(a.id)} />
                    <span className="truncate">{a.name}</span>
                  </label>
                  {isCustomItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomAmenity(a.id, a.name);
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors opacity-70 group-hover:opacity-100"
                      title="Delete custom amenity from this property"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
        >
          {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
          Save Selected Amenities
        </Button>
        {status === "saved" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Check className="h-3.5 w-3.5" /> All Amenities Saved Successfully
          </span>
        )}
        {status === "failed" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
            <AlertCircle className="h-3.5 w-3.5" /> Failed to save — try again
          </span>
        )}
      </div>
    </div>
  );
}
