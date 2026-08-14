"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
  Sparkles,
  BedDouble,
  Sofa,
  UtensilsCrossed,
  Utensils,
  Bath,
  Sun,
  Car,
  Shirt,
  Building,
  TreePine,
  Waves,
  Gamepad2,
  Dumbbell,
  Laptop,
  Compass,
  Plus,
  CheckCircle2,
  Info,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Check,
  Zap,
  CloudUpload,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  uploadPropertyPhotoAction,
  updatePropertyPhotoAction,
  setCoverPhotoAction,
  removePropertyPhotoAction,
  saveRoomSpecsAction,
  saveCustomSpacesAction,
  deleteCustomSpaceAction,
} from "@/features/properties/actions/onboarding.actions";
import type { PropertyRoomSpecs, RoomSpec } from "@/features/properties/types/property.types";
import { compressImage, formatBytes } from "@/lib/utils/image-compressor";

export const BEDROOM_AMENITY_CATEGORIES = [
  {
    category: "Bathroom & Privacy",
    items: [
      "Attached En-suite Bathroom",
      "Dedicated Private Bathroom",
      "Shared / Common Bathroom",
      "Bathtub in Bathroom",
      "Glass Shower Partition",
      "Hot Water Geyser",
      "Bathrobes & Fresh Towels",
    ],
  },
  {
    category: "Climate & Air",
    items: [
      "Air Conditioning (AC)",
      "Ceiling Fan",
      "Standing Tower Fan",
      "Room Heater / Climate Control",
    ],
  },
  {
    category: "Balcony & Views",
    items: [
      "Private Balcony Access",
      "Garden & Lawn View",
      "Mountain & Valley View",
      "City Skyline View",
      "Pool View",
      "Lake / River View",
      "Large Sunlit French Windows",
    ],
  },
  {
    category: "Entertainment & Work",
    items: [
      "Smart TV in Bedroom",
      "Work Desk & Ergonomic Chair",
      "High-Speed Room WiFi (100+ Mbps)",
      "Bedside Charging Outlets & USB Ports",
      "Bluetooth Speaker Setup",
    ],
  },
  {
    category: "Storage & Comfort",
    items: [
      "Wardrobe / Closet with Hangers",
      "Full-Length Dressing Mirror",
      "100% Blackout Curtains",
      "Mini Refrigerator in Room",
      "Electronic Safe Locker",
      "Steam Iron & Ironing Board",
      "Extra Pillows & Premium Duvet",
    ],
  },
];

export type PhotoItem = {
  id: string;
  isCover: boolean;
  caption?: string | null;
  tags?: string[];
  spaceTag?: string | null;
  sortOrder?: number;
  publicUrl: string | null;
};

type StagedFile = {
  key: string;
  file: File;
  previewUrl: string;
  spaceTag: string;
  caption: string;
  originalSize: number;
};

type UploadProgressState = {
  active: boolean;
  phase: "compressing" | "uploading" | "complete";
  currentIndex: number;
  totalFiles: number;
  currentFileName: string;
  currentOriginalBytes: number;
  currentCompressedBytes: number;
  currentSavedPercent: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedPercent: number;
  uploadPercent: number;
  overallPercent: number;
};

// Generates dynamic spaces according to bedroom and bathroom counts
export function getStandardSpaceCategories(bedroomsCount = 1, bathroomsCount = 1) {
  const safeBedrooms = Math.max(Number(bedroomsCount) || 1, 1);
  const safeBathrooms = Math.max(Number(bathroomsCount) || 1, 1);

  const spaces: { id: string; label: string; icon: React.ElementType; category: string }[] = [
    { id: "Living Room", label: "Living Room", icon: Sofa, category: "Living" },
  ];

  // Dynamic individual bedroom categories (Clean names: Bedroom 1, Bedroom 2...)
  for (let i = 1; i <= safeBedrooms; i++) {
    spaces.push({
      id: `Bedroom ${i}`,
      label: `Bedroom ${i}`,
      icon: BedDouble,
      category: "Bedrooms",
    });
  }

  // Separate Kitchen and Dining Area
  spaces.push({
    id: "Kitchen",
    label: "Kitchen",
    icon: UtensilsCrossed,
    category: "Kitchen",
  });

  spaces.push({
    id: "Dining Area",
    label: "Dining Area",
    icon: Utensils,
    category: "Kitchen",
  });

  // Dynamic individual bathroom categories (Clean names: Bathroom 1, Bathroom 2...)
  for (let j = 1; j <= safeBathrooms; j++) {
    spaces.push({
      id: `Bathroom ${j}`,
      label: `Bathroom ${j}`,
      icon: Bath,
      category: "Bathrooms",
    });
  }

  // Outdoor, leisure and facility spaces
  spaces.push(
    { id: "Balcony", label: "Balcony", icon: Sun, category: "Outdoor" },
    { id: "Terrace", label: "Terrace / Rooftop", icon: Sun, category: "Outdoor" },
    { id: "Private Swimming Pool", label: "Swimming Pool & Jacuzzi", icon: Waves, category: "Leisure" },
    { id: "Garden & Lawn", label: "Garden & Lawn", icon: TreePine, category: "Outdoor" },
    { id: "Entertainment & Games", label: "Entertainment & Games", icon: Gamepad2, category: "Leisure" },
    { id: "Gym & Fitness", label: "Gym & Fitness", icon: Dumbbell, category: "Leisure" },
    { id: "Dedicated Workspace", label: "Work / Study Setup", icon: Laptop, category: "Living" },
    { id: "Car Parking", label: "Car Parking Area", icon: Car, category: "Facilities" },
    { id: "Laundry & Utility", label: "Laundry & Utility", icon: Shirt, category: "Facilities" },
    { id: "Exterior & Entrance", label: "Exterior & Entrance", icon: Building, category: "Building" },
    { id: "Surroundings & Views", label: "Surroundings & Views", icon: Compass, category: "Outdoor" }
  );

  return spaces;
}

export function PhotosManager({
  propertyId,
  photos,
  bedrooms = 1,
  bathrooms = 1,
  initialRoomSpecs = {},
  savedCustomSpaces = [],
}: {
  propertyId: string;
  photos: PhotoItem[];
  bedrooms?: number;
  bathrooms?: number;
  initialRoomSpecs?: PropertyRoomSpecs;
  savedCustomSpaces?: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [roomSpecs, setRoomSpecs] = useState<PropertyRoomSpecs>(initialRoomSpecs);

  const baseStandardSpaces = useMemo(
    () => getStandardSpaceCategories(bedrooms, bathrooms),
    [bedrooms, bathrooms]
  );

  // Discover any custom spaces already present on uploaded photos or saved in rules
  const existingCustomSpaces = useMemo(() => {
    const standardIds = new Set(baseStandardSpaces.map((s) => s.id));
    const custom = new Set<string>(savedCustomSpaces);
    photos.forEach((p) => {
      if (p.spaceTag && !standardIds.has(p.spaceTag)) {
        custom.add(p.spaceTag);
      }
    });
    return Array.from(custom);
  }, [baseStandardSpaces, photos, savedCustomSpaces]);

  const [customSpaces, setCustomSpaces] = useState<string[]>(existingCustomSpaces);
  const [isAddingCustomSpace, setIsAddingCustomSpace] = useState(false);
  const [newCustomSpaceInput, setNewCustomSpaceInput] = useState("");

  // Sync custom spaces
  useEffect(() => {
    setCustomSpaces((prev) => {
      const combined = new Set([...prev, ...existingCustomSpaces]);
      return Array.from(combined);
    });
  }, [existingCustomSpaces]);

  // Combined space categories (standard + dynamic custom)
  const spaceCategories = useMemo(() => {
    const list = [...baseStandardSpaces];
    customSpaces.forEach((customName) => {
      if (!list.some((s) => s.id === customName)) {
        list.push({
          id: customName,
          label: customName,
          icon: Sparkles,
          category: "Custom",
        });
      }
    });
    return list;
  }, [baseStandardSpaces, customSpaces]);

  const [activeSpaceFilter, setActiveSpaceFilter] = useState<string>("all");
  const [uploadSpaceTarget, setUploadSpaceTarget] = useState<string>("Living Room");

  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    active: false,
    phase: "compressing",
    currentIndex: 0,
    totalFiles: 0,
    currentFileName: "",
    currentOriginalBytes: 0,
    currentCompressedBytes: 0,
    currentSavedPercent: 0,
    totalOriginalBytes: 0,
    totalCompressedBytes: 0,
    totalSavedPercent: 0,
    uploadPercent: 0,
    overallPercent: 0,
  });
  const [updatingPhotoId, setUpdatingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Helper to get or fallback spec for current room (no silent defaults)
  function getRoomSpec(spaceName: string): RoomSpec {
    if (roomSpecs[spaceName]) {
      const s = roomSpecs[spaceName];
      return {
        bedType: s.bedType || "",
        hasAc: s.hasAc ?? false,
        bathroomType: s.bathroomType || "attached",
        hasBalcony: s.hasBalcony ?? false,
        hasWorkDesk: s.hasWorkDesk ?? false,
        hasTv: s.hasTv ?? false,
        hasWardrobe: s.hasWardrobe ?? false,
        viewType: s.viewType,
        amenities: s.amenities ?? [],
      };
    }
    return {
      bedType: "",
      hasAc: false,
      bathroomType: "attached",
      hasBalcony: false,
      hasWorkDesk: false,
      hasTv: false,
      hasWardrobe: false,
      amenities: [],
    };
  }

  async function handleUpdateRoomSpec(spaceName: string, patch: Partial<RoomSpec>) {
    const current = getRoomSpec(spaceName);
    const updated: RoomSpec = { ...current, ...patch };
    const nextSpecs: PropertyRoomSpecs = { ...roomSpecs, [spaceName]: updated };
    setRoomSpecs(nextSpecs);
    try {
      await saveRoomSpecsAction(propertyId, nextSpecs);
      router.refresh();
    } catch {}
  }

  function handleToggleBedroomAmenity(spaceName: string, amenity: string) {
    const current = getRoomSpec(spaceName);
    const existing = current.amenities ?? [];
    const next = existing.includes(amenity)
      ? existing.filter((a) => a !== amenity)
      : [...existing, amenity];

    const patch: Partial<RoomSpec> = {
      amenities: next,
      hasAc: next.includes("Air Conditioning (AC)"),
      hasBalcony: next.includes("Private Balcony Access"),
      hasWorkDesk: next.includes("Work Desk & Ergonomic Chair"),
      hasTv: next.includes("Smart TV in Bedroom"),
      hasWardrobe: next.includes("Wardrobe / Closet with Hangers"),
    };

    if (amenity === "Attached En-suite Bathroom") {
      if (next.includes(amenity)) patch.bathroomType = "attached";
    } else if (amenity === "Dedicated Private Bathroom") {
      if (next.includes(amenity)) patch.bathroomType = "dedicated";
    } else if (amenity === "Shared / Common Bathroom") {
      if (next.includes(amenity)) patch.bathroomType = "common";
    }

    handleUpdateRoomSpec(spaceName, patch);
  }

  const [bedroomAmenitySearch, setBedroomAmenitySearch] = useState("");
  const [newBedroomAmenityInput, setNewBedroomAmenityInput] = useState("");
  const [isBedroomPopoverOpen, setIsBedroomPopoverOpen] = useState(false);

  function handleAddCustomBedroomAmenity(spaceName: string) {
    const trimmed = newBedroomAmenityInput.trim();
    if (!trimmed) return;
    const current = getRoomSpec(spaceName);
    const existing = current.amenities ?? [];
    if (!existing.includes(trimmed)) {
      handleUpdateRoomSpec(spaceName, {
        amenities: [...existing, trimmed],
      });
      setNewBedroomAmenityInput("");
    }
  }

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Photo counts per space
  const spaceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: photos.length };
    photos.forEach((p) => {
      const tag = p.spaceTag || "Living Room";
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, [photos]);

  async function handleCreateCustomSpace() {
    const trimmed = newCustomSpaceInput.trim();
    if (!trimmed) return;
    if (!customSpaces.includes(trimmed)) {
      const next = [...customSpaces, trimmed];
      setCustomSpaces(next);
      try {
        await saveCustomSpacesAction(propertyId, next);
      } catch {}
      setActiveSpaceFilter(trimmed);
      setUploadSpaceTarget(trimmed);
      setNewCustomSpaceInput("");
      setIsAddingCustomSpace(false);
      router.refresh();
    }
  }

  async function handleDeleteCustomSpace(spaceName: string) {
    try {
      await deleteCustomSpaceAction(propertyId, spaceName);
      setCustomSpaces((prev) => prev.filter((s) => s !== spaceName));
      if (activeSpaceFilter === spaceName) {
        setActiveSpaceFilter("all");
        setUploadSpaceTarget("Living Room");
      }
      router.refresh();
    } catch {}
  }

  function handleSelectFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newStaged: StagedFile[] = Array.from(files).map((f) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      spaceTag: activeSpaceFilter === "all" ? uploadSpaceTarget : activeSpaceFilter,
      caption: "",
      originalSize: f.size,
    }));
    setStaged((prev) => [...prev, ...newStaged]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeStaged(key: string) {
    setStaged((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.key !== key);
    });
  }

  function updateStagedSpace(key: string, spaceTag: string) {
    setStaged((prev) => prev.map((s) => (s.key === key ? { ...s, spaceTag } : s)));
  }

  function updateStagedCaption(key: string, caption: string) {
    setStaged((prev) => prev.map((s) => (s.key === key ? { ...s, caption } : s)));
  }

  // Compute all bedroom spaces currently assigned in staged photos
  const stagedBedroomSpaces = useMemo(() => {
    return Array.from(
      new Set(staged.map((s) => s.spaceTag).filter((tag): tag is string => Boolean(tag && tag.startsWith("Bedroom"))))
    ).sort();
  }, [staged]);

  async function handleUploadAll() {
    if (staged.length === 0) return;

    // Check if any staged bedroom is missing a mandatory bed type
    const missingBedTypeRoom = stagedBedroomSpaces.find((room) => !getRoomSpec(room).bedType);
    if (missingBedTypeRoom) {
      setError(`Please select a Bed Type for ${missingBedTypeRoom} before uploading photos.`);
      return;
    }

    setIsUploading(true);
    setError("");

    const totalFiles = staged.length;
    let totalOriginal = 0;
    let totalCompressed = 0;
    const processedItems: { file: File; spaceTag: string; caption: string; origSize: number; compSize: number; savedPct: number }[] = [];

    // Initialize live progress state
    setUploadProgress({
      active: true,
      phase: "compressing",
      currentIndex: 0,
      totalFiles,
      currentFileName: "",
      currentOriginalBytes: 0,
      currentCompressedBytes: 0,
      currentSavedPercent: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      totalSavedPercent: 0,
      uploadPercent: 0,
      overallPercent: 0,
    });

    try {
      // Phase 1: High-Fidelity 4K Client-Side Compression
      for (let i = 0; i < totalFiles; i++) {
        const item = staged[i];
        const origSize = item.file.size;
        totalOriginal += origSize;

        setUploadProgress((prev) => ({
          ...prev,
          phase: "compressing",
          currentIndex: i + 1,
          currentFileName: item.file.name,
          currentOriginalBytes: origSize,
          currentCompressedBytes: origSize,
          currentSavedPercent: 0,
          overallPercent: Math.round((i / (totalFiles * 2)) * 100),
        }));

        const result = await compressImage(item.file, {
          maxWidth: 2560,
          maxHeight: 2560,
          quality: 0.85,
          mimeType: "image/webp",
        });

        const compSize = result.file.size;
        totalCompressed += compSize;
        const savedPct = result.metrics.savedPercentage;
        const overallSavedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0;

        setUploadProgress((prev) => ({
          ...prev,
          currentCompressedBytes: compSize,
          currentSavedPercent: savedPct,
          totalOriginalBytes: totalOriginal,
          totalCompressedBytes: totalCompressed,
          totalSavedPercent: overallSavedPct,
          overallPercent: Math.round(((i + 1) / (totalFiles * 2)) * 100),
        }));

        processedItems.push({
          file: result.file,
          spaceTag: item.spaceTag || "Living Room",
          caption: item.caption.trim(),
          origSize,
          compSize,
          savedPct,
        });

        // Small delay for UI smoothness
        await new Promise((r) => setTimeout(r, 60));
      }

      // Phase 2: Cloud Storage Direct Upload
      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        const uploadPct = Math.round(((i + 1) / totalFiles) * 100);
        const overallPct = Math.round(50 + uploadPct / 2);

        setUploadProgress((prev) => ({
          ...prev,
          phase: "uploading",
          currentIndex: i + 1,
          currentFileName: item.file.name,
          uploadPercent: uploadPct,
          overallPercent: overallPct,
        }));

        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("spaceTag", item.spaceTag);
        if (item.caption) {
          formData.append("caption", item.caption);
        }

        await uploadPropertyPhotoAction(propertyId, formData);
      }

      // Phase 3: Complete
      const finalSavedPct = totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0;
      setUploadProgress((prev) => ({
        ...prev,
        phase: "complete",
        overallPercent: 100,
        totalSavedPercent: finalSavedPct,
      }));

      // Celebration delay before clearing
      await new Promise((r) => setTimeout(r, 1000));

      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photos.");
    } finally {
      setIsUploading(false);
      setUploadProgress((prev) => ({ ...prev, active: false }));
    }
  }

  async function handleChangeSpace(photoId: string, spaceTag: string) {
    setUpdatingPhotoId(photoId);
    try {
      await updatePropertyPhotoAction(propertyId, photoId, { spaceTag });
      router.refresh();
    } finally {
      setUpdatingPhotoId(null);
    }
  }

  async function handleUpdateCaption(photoId: string, caption: string) {
    setUpdatingPhotoId(photoId);
    try {
      await updatePropertyPhotoAction(propertyId, photoId, { caption });
      router.refresh();
    } finally {
      setUpdatingPhotoId(null);
    }
  }

  async function handleSetCover(photoId: string) {
    setUpdatingPhotoId(photoId);
    try {
      await setCoverPhotoAction(propertyId, photoId);
      router.refresh();
    } finally {
      setUpdatingPhotoId(null);
    }
  }

  async function handleRemove(photoId: string) {
    setUpdatingPhotoId(photoId);
    try {
      await removePropertyPhotoAction(propertyId, photoId);
      router.refresh();
    } finally {
      setUpdatingPhotoId(null);
    }
  }

  // Map space categories to exact filter chip rank
  const spaceOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    spaceCategories.forEach((cat, index) => {
      map.set(cat.id, index);
    });
    return map;
  }, [spaceCategories]);

  // Sort photos into natural chip-order (Cover first, then Living Room -> Bedroom 1 -> Bedroom 2 -> Kitchen -> Dining -> Bathrooms, etc.)
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      // 1. Cover photo always comes first
      if (a.isCover && !b.isCover) return -1;
      if (!a.isCover && b.isCover) return 1;

      // 2. Order by filter chipset sequence (Living Room -> Bedroom 1 -> Bedroom 2 ...)
      const spaceA = a.spaceTag || "Living Room";
      const spaceB = b.spaceTag || "Living Room";
      const rankA = spaceOrderMap.has(spaceA) ? spaceOrderMap.get(spaceA)! : 999;
      const rankB = spaceOrderMap.has(spaceB) ? spaceOrderMap.get(spaceB)! : 999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // 3. Within same space, preserve sortOrder or creation order
      const sortA = a.sortOrder ?? 0;
      const sortB = b.sortOrder ?? 0;
      if (sortA !== sortB) return sortA - sortB;
      return (a.id || "").localeCompare(b.id || "");
    });
  }, [photos, spaceOrderMap]);

  // Filtered photos based on active space filter
  const filteredPhotos = useMemo(() => {
    if (activeSpaceFilter === "all") {
      return sortedPhotos;
    }
    return sortedPhotos.filter((p) => (p.spaceTag || "Living Room") === activeSpaceFilter);
  }, [activeSpaceFilter, sortedPhotos]);

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 p-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Airbnb-Style Room & Space Photo Organizer
          </h4>
          <p className="text-xs text-muted-foreground">
            Organize room photos with per-bedroom amenities (AC, Attached Bath, Balcony, TV, Fan). Guests convert 3x faster with categorized tours!
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 border border-emerald-400/40">
            {photos.length} Total Photos
          </span>
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 px-3 py-1 border border-amber-400/40 text-amber-900 dark:text-amber-300">
            {photos.some((p) => p.isCover) ? "✓ Cover Set" : "★ Need Cover"}
          </span>
        </div>
      </div>

      {/* Space Filter Tabs & Custom Space Creator */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Filter & Organize by Space
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Click a room tab to view photos, configure room-specific amenities, or add custom spaces
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingCustomSpace((prev) => !prev)}
            className="h-7 text-xs border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Space</span>
          </Button>
        </div>

        {/* Custom Space Input Reveal */}
        {isAddingCustomSpace && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <Input
              placeholder="e.g. Rooftop Jacuzzi, Kids Playroom, Wine Cellar, Gazebo..."
              value={newCustomSpaceInput}
              onChange={(e) => setNewCustomSpaceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCustomSpace();
                } else if (e.key === "Escape") {
                  setIsAddingCustomSpace(false);
                }
              }}
              className="h-8 text-xs bg-background flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCustomSpace}
              disabled={!newCustomSpaceInput.trim()}
              className="h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
            >
              Add Space
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingCustomSpace(false)}
              className="h-8 text-xs text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveSpaceFilter("all");
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeSpaceFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200"
            }`}
          >
            <span>All Spaces</span>
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">{spaceCounts.all || 0}</span>
          </button>

          {spaceCategories.map((space) => {
            const Icon = space.icon;
            const count = spaceCounts[space.id] || 0;
            const isActive = activeSpaceFilter === space.id;
            const isCustomSpace = space.category === "Custom";
            return (
              <div
                key={space.id}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveSpaceFilter(space.id);
                    setUploadSpaceTarget(space.id);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-300" : "text-slate-500"}`} />
                  <span>{space.label}</span>
                  {count > 0 && (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
                      {count}
                    </span>
                  )}
                </button>
                {isCustomSpace && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomSpace(space.id);
                    }}
                    className={`ml-0.5 p-0.5 rounded-full transition-colors ${
                      isActive
                        ? "text-emerald-300 hover:text-red-300 hover:bg-emerald-900"
                        : "text-muted-foreground hover:text-destructive hover:bg-slate-300 dark:hover:bg-slate-700"
                    }`}
                    title={`Delete custom space "${space.label}" from this property`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Room Dynamic Specifics & Multi-Select Dropdown Configurator (Only when a bedroom is active) */}
      {activeSpaceFilter.startsWith("Bedroom") && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                {activeSpaceFilter} Amenities & Specific Features
              </p>
            </div>
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              Synchronized with photos and guest room tour
            </span>
          </div>

          {(() => {
            const spec = getRoomSpec(activeSpaceFilter);
            const activeAmenities = spec.amenities ?? [];

            return (
              <div className="space-y-3.5 text-xs">
                {/* Top Row: Bed Type & Multi-Select Dropdown Button */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bed Type */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Bed Type:</Label>
                    <Select
                      value={spec.bedType || ""}
                      onValueChange={(val) => {
                        const nextAmenities = [
                          val,
                          ...activeAmenities.filter(
                            (a) => !["King Bed", "Queen Bed", "Double Bed", "Twin Beds", "Single Bed", "Sofa Bed", "Bunk Bed"].includes(a)
                          ),
                        ];
                        handleUpdateRoomSpec(activeSpaceFilter, { bedType: val, amenities: nextAmenities });
                      }}
                    >
                      <SelectTrigger className={`h-8 text-xs bg-background ${!spec.bedType ? "border-amber-500 font-semibold" : ""}`}>
                        <SelectValue placeholder="Select Bed Type *" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="King Bed" className="text-xs">King Bed</SelectItem>
                        <SelectItem value="Queen Bed" className="text-xs">Queen Bed</SelectItem>
                        <SelectItem value="Double Bed" className="text-xs">Double Bed</SelectItem>
                        <SelectItem value="Twin Beds" className="text-xs">Twin Beds</SelectItem>
                        <SelectItem value="Single Bed" className="text-xs">Single Bed</SelectItem>
                        <SelectItem value="Sofa Bed" className="text-xs">Sofa Bed</SelectItem>
                        <SelectItem value="Bunk Bed" className="text-xs">Bunk Bed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multi-Select Dropdown Popover Trigger */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Configure Amenities:</Label>
                    <Popover open={isBedroomPopoverOpen} onOpenChange={setIsBedroomPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 justify-between text-xs bg-background border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-bold"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Select Amenities ({activeAmenities.length})</span>
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 sm:w-96 p-3 space-y-3 max-h-[380px] overflow-y-auto" align="end">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground">
                            {activeSpaceFilter} Amenities Checklist
                          </p>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search amenities (e.g. AC, Balcony, TV)..."
                              value={bedroomAmenitySearch}
                              onChange={(e) => setBedroomAmenitySearch(e.target.value)}
                              className="h-7 pl-7 text-[11px] bg-background"
                            />
                          </div>
                        </div>

                        {/* Categorized Checkbox List */}
                        <div className="space-y-3">
                          {BEDROOM_AMENITY_CATEGORIES.map((cat) => {
                            const filteredItems = cat.items.filter((item) =>
                              !bedroomAmenitySearch.trim() || item.toLowerCase().includes(bedroomAmenitySearch.toLowerCase())
                            );
                            if (filteredItems.length === 0) return null;

                            return (
                              <div key={cat.category} className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {cat.category}
                                </p>
                                <div className="space-y-1">
                                  {filteredItems.map((item) => {
                                    const isChecked = activeAmenities.includes(item);
                                    return (
                                      <label
                                        key={item}
                                        className={`flex items-center gap-2 rounded-lg p-1.5 text-xs font-medium cursor-pointer transition-colors ${
                                          isChecked
                                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-semibold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={() => handleToggleBedroomAmenity(activeSpaceFilter, item)}
                                        />
                                        <span className="flex-1 text-[11px]">{item}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Custom Item for this Bedroom */}
                        <div className="border-t border-border pt-2.5 space-y-1.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            + Add Custom Bedroom Item
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Input
                              placeholder="e.g. Baby Cot, Recliner, Wine Fridge..."
                              value={newBedroomAmenityInput}
                              onChange={(e) => setNewBedroomAmenityInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomBedroomAmenity(activeSpaceFilter);
                                }
                              }}
                              className="h-7 text-[11px] bg-background flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddCustomBedroomAmenity(activeSpaceFilter)}
                              disabled={!newBedroomAmenityInput.trim()}
                              className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Active Amenities Badges List */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                    <span>Active {activeSpaceFilter} Amenities:</span>
                    <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                      {activeAmenities.length} items configured
                    </span>
                  </p>
                  {activeAmenities.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic bg-background/60 rounded-lg p-2 border border-dashed border-emerald-500/30">
                      No amenities configured for this room yet. Click &quot;Select Amenities&quot; above to customize features (e.g. AC, Attached Bath, Balcony, Work Desk).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {activeAmenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 border border-emerald-500/30 shadow-2xs"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleBedroomAmenity(activeSpaceFilter, amenity)}
                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                            title="Remove amenity from this bedroom"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center hover:border-emerald-500/50 transition-colors">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Upload className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Upload Photos to:{" "}
              <span className="text-emerald-700 dark:text-emerald-400">
                {activeSpaceFilter === "all" ? uploadSpaceTarget : activeSpaceFilter}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              High-resolution JPG, PNG, WebP — select multiple photos from your device
            </p>
          </div>

          {activeSpaceFilter === "all" && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground">Target Space:</span>
              <Select value={uploadSpaceTarget} onValueChange={setUploadSpaceTarget}>
                <SelectTrigger className="h-8 text-xs bg-background min-w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {spaceCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleSelectFiles(e.target.files)}
            className="hidden"
            id="photos-file-input"
          />

          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Choose Photos
          </Button>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

      {/* Staged Upload Previews (Before Sending) */}
      {staged.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                {staged.length} Photo{staged.length === 1 ? "" : "s"} Ready for Upload
              </p>
              <p className="text-[11px] text-muted-foreground">
                Assign room categories or add captions before uploading
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
                  setStaged([]);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={isUploading}
                className="border-border bg-background text-foreground hover:bg-muted text-xs h-8"
              >
                Clear Queue
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUploadAll}
                disabled={isUploading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm h-8"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing & Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Upload All {staged.length} Photos
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Real-time Image Compression & Upload Progress Box */}
          {uploadProgress.active && (
            <div className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-emerald-950/50 p-3.5 space-y-3 shadow-md animate-in fade-in-50 duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {uploadProgress.phase === "compressing" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-amber-950 shadow-sm animate-pulse">
                      <Zap className="h-4 w-4 fill-current" />
                    </div>
                  ) : uploadProgress.phase === "uploading" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm animate-bounce">
                      <CloudUpload className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                      {uploadProgress.phase === "compressing" && (
                        <span>⚡ Step 1: Compressing Image {uploadProgress.currentIndex} of {uploadProgress.totalFiles}...</span>
                      )}
                      {uploadProgress.phase === "uploading" && (
                        <span>☁️ Step 2: Uploading Photo {uploadProgress.currentIndex} of {uploadProgress.totalFiles}...</span>
                      )}
                      {uploadProgress.phase === "complete" && (
                        <span>🎉 All {uploadProgress.totalFiles} Photos Compressed & Uploaded!</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md font-medium">
                      {uploadProgress.currentFileName || "Optimizing photos..."}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-emerald-900 dark:text-emerald-300">
                    {uploadProgress.overallPercent}%
                  </span>
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {uploadProgress.phase === "compressing" ? "Client 4K WebP Compression" : "Direct Cloud Storage"}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/70 dark:bg-emerald-900/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress.overallPercent}%` }}
                />
              </div>

              {/* Real-time Compression & Upload Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {/* Current File Savings */}
                <div className="flex items-center justify-between rounded-lg bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 border border-emerald-500/20 shadow-2xs">
                  <span className="text-muted-foreground font-medium">Current Image:</span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span>{formatBytes(uploadProgress.currentOriginalBytes)}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-emerald-700 dark:text-emerald-400">{formatBytes(uploadProgress.currentCompressedBytes)}</span>
                    {uploadProgress.currentSavedPercent > 0 && (
                      <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-1 text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
                        -{uploadProgress.currentSavedPercent}%
                      </span>
                    )}
                  </span>
                </div>

                {/* Batch Total Savings */}
                <div className="flex items-center justify-between rounded-lg bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 border border-emerald-500/20 shadow-2xs">
                  <span className="text-muted-foreground font-medium">Total Batch Saved:</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>{formatBytes(uploadProgress.totalOriginalBytes)} ➔ {formatBytes(uploadProgress.totalCompressedBytes)}</span>
                    {uploadProgress.totalSavedPercent > 0 && (
                      <span className="rounded bg-emerald-600 text-white px-1.5 py-0.2 text-[10px] font-extrabold shadow-2xs">
                        {uploadProgress.totalSavedPercent}% Saved
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mandatory Bed Type for Bedrooms in this Upload Batch */}
          {stagedBedroomSpaces.length > 0 && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Specify Bed Type for Staged Bedrooms <span className="text-destructive">*</span>
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                  Required before uploading
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {stagedBedroomSpaces.map((roomName) => {
                  const spec = getRoomSpec(roomName);
                  const hasBedType = Boolean(spec.bedType);
                  const roomAmenities = spec.amenities ?? [];

                  return (
                    <div
                      key={roomName}
                      className={`rounded-xl border p-2.5 space-y-2 transition-all ${
                        hasBedType
                          ? "bg-background border-emerald-500/40 shadow-2xs"
                          : "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <Label className="text-[11px] font-bold text-foreground">{roomName}</Label>
                        </div>
                        {hasBedType ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            * Bed Required
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground">Bed Type <span className="text-destructive">*</span>:</Label>
                        <Select
                          value={spec.bedType || ""}
                          onValueChange={(val) => {
                            const nextAmenities = [
                              val,
                              ...roomAmenities.filter(
                                (a) => !["King Bed", "Queen Bed", "Double Bed", "Twin Beds", "Single Bed", "Sofa Bed", "Bunk Bed"].includes(a)
                              ),
                            ];
                            handleUpdateRoomSpec(roomName, { bedType: val, amenities: nextAmenities });
                          }}
                        >
                          <SelectTrigger
                            className={`h-7 text-xs bg-background ${
                              !hasBedType ? "border-amber-500 text-amber-950 dark:text-amber-200 font-semibold" : ""
                            }`}
                          >
                            <SelectValue placeholder="Select Bed Type *" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="King Bed" className="text-xs">King Bed</SelectItem>
                            <SelectItem value="Queen Bed" className="text-xs">Queen Bed</SelectItem>
                            <SelectItem value="Double Bed" className="text-xs">Double Bed</SelectItem>
                            <SelectItem value="Twin Beds" className="text-xs">Twin Beds</SelectItem>
                            <SelectItem value="Single Bed" className="text-xs">Single Bed</SelectItem>
                            <SelectItem value="Sofa Bed" className="text-xs">Sofa Bed</SelectItem>
                            <SelectItem value="Bunk Bed" className="text-xs">Bunk Bed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground">Room Amenities (Optional):</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full h-7 justify-between text-xs bg-background border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-semibold"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <SlidersHorizontal className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Select Amenities ({roomAmenities.length})</span>
                              </span>
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 sm:w-96 p-3 space-y-2.5 max-h-[380px] overflow-y-auto" align="start">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-foreground">
                                {roomName} Amenities Checklist
                              </p>
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  placeholder="Search amenities (e.g. AC, Balcony, TV)..."
                                  value={bedroomAmenitySearch}
                                  onChange={(e) => setBedroomAmenitySearch(e.target.value)}
                                  className="h-7 pl-7 text-[11px] bg-background"
                                />
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              {BEDROOM_AMENITY_CATEGORIES.map((cat) => {
                                const filteredItems = cat.items.filter((item) =>
                                  !bedroomAmenitySearch.trim() || item.toLowerCase().includes(bedroomAmenitySearch.toLowerCase())
                                );
                                if (filteredItems.length === 0) return null;

                                return (
                                  <div key={cat.category} className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      {cat.category}
                                    </p>
                                    <div className="space-y-1">
                                      {filteredItems.map((item) => {
                                        const isChecked = roomAmenities.includes(item);
                                        return (
                                          <label
                                            key={item}
                                            className={`flex items-center gap-2 rounded-md p-1 text-[11px] font-medium cursor-pointer transition-colors ${
                                              isChecked
                                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-semibold"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                                            }`}
                                          >
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={() => handleToggleBedroomAmenity(roomName, item)}
                                            />
                                            <span className="flex-1 text-[11px]">{item}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="border-t border-border pt-2 space-y-1.5">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                + Add Custom Bedroom Item
                              </p>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  placeholder="e.g. Baby Cot, Recliner..."
                                  value={newBedroomAmenityInput}
                                  onChange={(e) => setNewBedroomAmenityInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddCustomBedroomAmenity(roomName);
                                    }
                                  }}
                                  className="h-7 text-[11px] bg-background flex-1"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleAddCustomBedroomAmenity(roomName)}
                                  disabled={!newBedroomAmenityInput.trim()}
                                  className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {roomAmenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {roomAmenities.slice(0, 2).map((amenity) => (
                            <span
                              key={amenity}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-foreground truncate max-w-[130px]"
                            >
                              <span>{amenity}</span>
                            </span>
                          ))}
                          {roomAmenities.length > 2 && (
                            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold self-center">
                              +{roomAmenities.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staged.map((s) => (
              <div key={s.key} className="flex gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm">
                <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.previewUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute left-1 bottom-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white shadow-xs">
                    {formatBytes(s.originalSize)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStaged(s.key)}
                    disabled={isUploading}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/90"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <Select value={s.spaceTag} onValueChange={(val) => updateStagedSpace(s.key, val)}>
                    <SelectTrigger className="h-7 text-[11px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {spaceCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Caption (e.g. King Bed, Balcony)"
                    value={s.caption}
                    onChange={(e) => updateStagedCaption(s.key, e.target.value)}
                    className="h-7 text-[11px] bg-background"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Gallery by Space */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">
            {activeSpaceFilter === "all"
              ? `All Uploaded Photos (${filteredPhotos.length})`
              : `${activeSpaceFilter} Photos (${filteredPhotos.length})`}
          </p>
          <span className="text-[11px] text-muted-foreground">
            Change room tag or caption anytime below
          </span>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              No photos uploaded for {activeSpaceFilter === "all" ? "this property" : activeSpaceFilter} yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Use the upload button above to add photos directly to this space!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPhotos.map((photo) => {
              const currentSpace = photo.spaceTag || "Living Room";
              const isBusy = updatingPhotoId === photo.id;

              return (
                <div
                  key={photo.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md ${
                    photo.isCover ? "ring-2 ring-gold shadow-gold/10" : ""
                  }`}
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-[4/3] w-full bg-soft">
                    {photo.publicUrl ? (
                      <Image src={photo.publicUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No image preview
                      </div>
                    )}

                    {/* Cover Photo Badge */}
                    {photo.isCover && (
                      <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 shadow-md">
                        <Star className="h-3 w-3 fill-amber-950" /> Primary Cover
                      </div>
                    )}

                    {/* Action Overlay */}
                    <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5">
                      {!photo.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(photo.id)}
                          disabled={isBusy}
                          title="Set as primary listing cover"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-amber-500 hover:text-amber-950 transition-colors"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(photo.id)}
                        disabled={isBusy}
                        title="Delete photo"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-destructive hover:text-white transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Photo Space & Caption Metadata Form */}
                  <div className="p-3 space-y-2 bg-card">
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase w-12 shrink-0">
                        Space:
                      </Label>
                      <Select
                        value={currentSpace}
                        onValueChange={(val) => handleChangeSpace(photo.id, val)}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="h-7 text-xs bg-background flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {spaceCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase w-12 shrink-0">
                        Caption:
                      </Label>
                      <Input
                        defaultValue={photo.caption || ""}
                        placeholder="e.g. Master Bed with balcony"
                        onBlur={(e) => {
                          if (e.target.value !== (photo.caption || "")) {
                            handleUpdateCaption(photo.id, e.target.value);
                          }
                        }}
                        disabled={isBusy}
                        className="h-7 text-xs bg-background flex-1"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
