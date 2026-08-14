"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Sparkles,
  Wifi,
  Tv,
  Wind,
  UtensilsCrossed,
  Car,
  Waves,
  TreePine,
  ShieldCheck,
  Flame,
  Shirt,
  Laptop,
  Maximize2,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const AMENITY_CATEGORY_MAP: Record<string, { category: string; icon: React.ElementType }> = {
  // Climate & Essentials
  "Air Conditioning": { category: "Climate & Comfort", icon: Wind },
  "Central Air Conditioning": { category: "Climate & Comfort", icon: Wind },
  "Ceiling Fan": { category: "Climate & Comfort", icon: Wind },
  "Heating": { category: "Climate & Comfort", icon: Flame },
  "High-Speed Wi-Fi": { category: "Internet & Office", icon: Wifi },
  "High-Speed WiFi (100+ Mbps)": { category: "Internet & Office", icon: Wifi },
  "Dedicated Workspace": { category: "Internet & Office", icon: Laptop },
  "Ergonomic Chair": { category: "Internet & Office", icon: Laptop },

  // Entertainment
  "Smart TV with OTT (Netflix, Prime)": { category: "Entertainment", icon: Tv },
  "Smart TV": { category: "Entertainment", icon: Tv },
  "Smart HD TV": { category: "Entertainment", icon: Tv },
  "Music System": { category: "Entertainment", icon: Sparkles },
  "Bluetooth Speaker": { category: "Entertainment", icon: Sparkles },
  "Board Games": { category: "Entertainment", icon: Sparkles },

  // Kitchen & Dining
  "Fully Equipped Modular Kitchen": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Refrigerator": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Microwave": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Induction Cooktop / Stove": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Gas Stove": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "RO Water Purifier": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Electric Kettle": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Toaster": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Crockery & Cutlery Set": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Dining Table": { category: "Kitchen & Dining", icon: UtensilsCrossed },
  "Coffee Maker": { category: "Kitchen & Dining", icon: UtensilsCrossed },

  // Outdoor & Views
  "Private Swimming Pool": { category: "Outdoor & Leisure", icon: Waves },
  "Plunge Pool": { category: "Outdoor & Leisure", icon: Waves },
  "Jacuzzi": { category: "Outdoor & Leisure", icon: Waves },
  "Private Balcony / Terrace": { category: "Outdoor & Leisure", icon: TreePine },
  "Private Lawn / Garden": { category: "Outdoor & Leisure", icon: TreePine },
  "Bonfire Pit": { category: "Outdoor & Leisure", icon: Flame },
  "Barbecue (BBQ) Grill Setup": { category: "Outdoor & Leisure", icon: Flame },
  "Outdoor Furniture": { category: "Outdoor & Leisure", icon: TreePine },
  "Mountain View": { category: "Scenic Views", icon: TreePine },
  "Lake View": { category: "Scenic Views", icon: Waves },
  "Pool View": { category: "Scenic Views", icon: Waves },
  "Garden View": { category: "Scenic Views", icon: TreePine },
  "City Skyline View": { category: "Scenic Views", icon: Sparkles },

  // Bathroom & Laundry
  "Geyser / 24x7 Hot Water": { category: "Bathroom & Laundry", icon: Sparkles },
  "Hot Water / Geyser": { category: "Bathroom & Laundry", icon: Sparkles },
  "Washing Machine": { category: "Bathroom & Laundry", icon: Shirt },
  "Iron & Ironing Board": { category: "Bathroom & Laundry", icon: Shirt },
  "Hair Dryer": { category: "Bathroom & Laundry", icon: Sparkles },
  "Towels & Bed Linen Provided": { category: "Bathroom & Laundry", icon: Sparkles },
  "Luxury Toiletries (Soap, Shampoo)": { category: "Bathroom & Laundry", icon: Sparkles },

  // Safety & Facilities
  "Free On-Premises Car Parking": { category: "Parking & Facilities", icon: Car },
  "Covered Car Parking": { category: "Parking & Facilities", icon: Car },
  "EV Charger": { category: "Parking & Facilities", icon: Car },
  "100% Power Backup (Inverter/DG)": { category: "Facilities & Safety", icon: ShieldCheck },
  "24/7 Security / CCTV in Common Areas": { category: "Facilities & Safety", icon: ShieldCheck },
  "First Aid Kit": { category: "Facilities & Safety", icon: ShieldCheck },
  "Fire Extinguisher": { category: "Facilities & Safety", icon: ShieldCheck },
  "Daily Housekeeping (On Request)": { category: "Services", icon: Sparkles },
  "Private Chef on Demand": { category: "Services", icon: UtensilsCrossed },
  "Caretaker on Premises": { category: "Services", icon: ShieldCheck },
  "Keyless Digital Smart Lock Access": { category: "Facilities & Safety", icon: ShieldCheck },
};

export function PropertyAmenitiesShowcase({
  amenities,
  propertyName,
}: {
  amenities: string[];
  propertyName: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const defaultCategory = "Property Features";

  // Group amenities by category
  const groupedAmenities: Record<string, string[]> = {};

  amenities.forEach((a) => {
    const meta = AMENITY_CATEGORY_MAP[a];
    const cat = meta ? meta.category : defaultCategory;
    if (!groupedAmenities[cat]) groupedAmenities[cat] = [];
    groupedAmenities[cat].push(a);
  });

  const previewList = amenities.slice(0, 10);

  return (
    <section id="amenities-inclusions" className="border-t border-border/80 pt-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
            Inclusions & Comforts
          </div>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            What This Place Offers
          </h2>
        </div>

        {amenities.length > 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="rounded-full text-xs h-8 font-bold gap-1.5 hidden sm:inline-flex"
          >
            Show All {amenities.length} Amenities
          </Button>
        )}
      </div>

      {/* Grid of Preview Amenities */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
        {previewList.map((amenity) => {
          const meta = AMENITY_CATEGORY_MAP[amenity];
          const Icon = meta?.icon ?? CheckCircle2;
          return (
            <div
              key={amenity}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all hover:border-emerald-500/30"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{amenity}</span>
            </div>
          );
        })}
      </div>

      {amenities.length > 10 && (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto rounded-2xl border-border/80 px-6 py-2.5 text-xs sm:text-sm font-bold text-foreground hover:bg-muted"
          >
            Show All {amenities.length} Amenities & Inclusions
          </Button>
        </div>
      )}

      {/* Full Categorized Amenities Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Amenities at {propertyName}
            </DialogTitle>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search amenities (e.g. WiFi, Pool, AC, Kitchen)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-background"
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {Object.entries(groupedAmenities).map(([category, items]) => {
              const filtered = items.filter((i) =>
                !search.trim() || i.toLowerCase().includes(search.toLowerCase())
              );
              if (filtered.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filtered.map((item) => {
                      const meta = AMENITY_CATEGORY_MAP[item];
                      const Icon = meta?.icon ?? CheckCircle2;
                      return (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 p-3 border border-border"
                        >
                          <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-foreground">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
