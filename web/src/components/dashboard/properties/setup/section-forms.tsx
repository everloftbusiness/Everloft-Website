"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ExternalLink, Sparkles, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { InteractiveLocationMap } from "./interactive-location-map";
import { SectionFormShell } from "./section-form-shell";
import {
  saveBasicsAction,
  saveLocationAction,
  saveTitleAction,
  saveDescriptionAction,
  saveHouseRulesAction,
  savePricingAction,
  saveAvailabilityAction,
  saveGuestRequirementsAction,
  resolveGoogleMapLocationAction,
  reverseGeocodeCoordsAction,
} from "@/features/properties/actions/onboarding.actions";

type LookupOption = { id: string; name: string };

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export function BasicsForm({
  propertyId,
  types,
  categories,
  initial,
}: {
  propertyId: string;
  types: LookupOption[];
  categories: LookupOption[];
  initial: { typeId: string | null; categoryId: string | null; maxGuests: number | null; bedrooms: number | null; bathrooms: number | null };
}) {
  const [typeId, setTypeId] = useState<string>(initial.typeId || "");
  const [categoryId, setCategoryId] = useState<string>(initial.categoryId || "none");

  useEffect(() => {
    if (initial.typeId) setTypeId(initial.typeId);
    if (initial.categoryId) setCategoryId(initial.categoryId);
  }, [initial.typeId, initial.categoryId]);

  return (
    <SectionFormShell action={saveBasicsAction.bind(null, propertyId)}>
      <input type="hidden" name="typeId" value={typeId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">Property Type *</Label>
          <Select value={typeId} onValueChange={setTypeId} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">Category (Optional)</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Standard)</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5">Max Guests</Label>
          <Input name="maxGuests" type="number" min={1} required defaultValue={initial.maxGuests ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">Bedrooms (Min 1)</Label>
          <Input name="bedrooms" type="number" min={1} required defaultValue={initial.bedrooms ?? 1} />
        </div>
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">Bathrooms (Min 1)</Label>
          <Input name="bathrooms" type="number" min={1} required defaultValue={initial.bathrooms ?? 1} />
        </div>
      </div>
    </SectionFormShell>
  );
}

export function LocationForm({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: {
    country: string;
    state: string | null;
    city: string | null;
    address: string | null;
    pinCode?: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapsUrl: string | null;
  };
}) {
  const [address, setAddress] = useState(initial.address || "");
  const [city, setCity] = useState(initial.city || "");
  const [state, setState] = useState(initial.state || "Karnataka");
  const [pinCode, setPinCode] = useState(initial.pinCode || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initial.googleMapsUrl || "");
  const [latitude, setLatitude] = useState(initial.latitude !== null && initial.latitude !== undefined ? String(initial.latitude) : "");
  const [longitude, setLongitude] = useState(initial.longitude !== null && initial.longitude !== undefined ? String(initial.longitude) : "");

  const [mapInputUrl, setMapInputUrl] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (initial.address) setAddress(initial.address);
    if (initial.city) setCity(initial.city);
    if (initial.state) setState(initial.state);
    if (initial.pinCode) setPinCode(initial.pinCode);
    if (initial.googleMapsUrl) setGoogleMapsUrl(initial.googleMapsUrl);
    if (initial.latitude !== null && initial.latitude !== undefined) setLatitude(String(initial.latitude));
    if (initial.longitude !== null && initial.longitude !== undefined) setLongitude(String(initial.longitude));
  }, [initial.address, initial.city, initial.state, initial.pinCode, initial.googleMapsUrl, initial.latitude, initial.longitude]);

  async function handleAutoDetect(inputToDetect?: string) {
    const urlToUse = (inputToDetect || mapInputUrl || googleMapsUrl).trim();
    if (!urlToUse) return;
    setIsDetecting(true);
    setDetectionFeedback(null);
    try {
      const result = await resolveGoogleMapLocationAction(urlToUse);
      if (result) {
        setAddress(result.address);
        setCity(result.city);
        setState(result.state);
        setPinCode(result.pinCode);
        setLatitude(String(result.latitude));
        setLongitude(String(result.longitude));
        setGoogleMapsUrl(result.googleMapsUrl);
        setMapInputUrl("");
        setDetectionFeedback({
          type: "success",
          message: `✨ Auto-detected: ${result.address}, ${result.city}, ${result.state} (${result.pinCode || "India"}). All fields populated — you can freely edit them below or drag the map pin.`,
        });
      } else {
        setDetectionFeedback({
          type: "error",
          message: "Could not extract location from link. Please enter details manually or click on the map to place the pin.",
        });
      }
    } catch {
      setDetectionFeedback({
        type: "error",
        message: "Failed to detect location from link. Please enter details manually.",
      });
    } finally {
      setIsDetecting(false);
    }
  }

  async function handleMapPositionChange({ lat, lng }: { lat: number; lng: number }) {
    setLatitude(String(lat));
    setLongitude(String(lng));
    const newGoogleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    setGoogleMapsUrl(newGoogleMapsUrl);

    // Auto reverse-geocode on pin movement
    try {
      const res = await reverseGeocodeCoordsAction(lat, lng);
      if (res) {
        if (res.address) setAddress(res.address);
        if (res.city) setCity(res.city);
        if (res.state) setState(res.state);
        if (res.pinCode) setPinCode(res.pinCode);
        setDetectionFeedback({
          type: "success",
          message: `📍 Pin placed at: ${res.address}, ${res.city}, ${res.state}. Google Maps link & coordinates updated!`,
        });
      }
    } catch {
      // keep current input values if reverse geocoding is unavailable
    }
  }

  const parsedLat = latitude ? parseFloat(latitude) : null;
  const parsedLng = longitude ? parseFloat(longitude) : null;

  return (
    <SectionFormShell action={saveLocationAction.bind(null, propertyId)}>
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="country" value="India" />

      {/* Auto-Detect from Google Maps Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold">Auto-Fill from Google Maps Link</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste any Google Maps share link (e.g. <code>https://maps.app.goo.gl/wyWYESN3cb361QhM7</code> or coordinates) to instantly auto-detect and populate Address, City, State, and PIN Code!
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/...)"
              value={mapInputUrl}
              onChange={(e) => setMapInputUrl(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted.includes("goo.gl") || pasted.includes("google.com/maps") || pasted.match(/\d+\.\d+,\s*\d+\.\d+/)) {
                  setTimeout(() => handleAutoDetect(pasted), 50);
                }
              }}
              className="pl-9 bg-background"
            />
          </div>
          <Button
            type="button"
            disabled={isDetecting || !mapInputUrl.trim()}
            onClick={() => handleAutoDetect()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold shrink-0"
          >
            {isDetecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Auto-Detecting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-Detect & Fill
              </>
            )}
          </Button>
        </div>

        {/* Feedback Alert */}
        {detectionFeedback && (
          <div
            className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${
              detectionFeedback.type === "success"
                ? "bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {detectionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            )}
            <span>{detectionFeedback.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
        {/* 1. Full Address */}
        <div className="sm:col-span-2">
          <Label className="mb-1.5 font-semibold text-foreground">Full Address (Street / Building / Flat) *</Label>
          <Input
            name="address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Villa #12, Palm Meadows, Whitefield"
          />
        </div>

        {/* 2. City */}
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">City *</Label>
          <Input
            name="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Bangalore, Mumbai, Jaipur, Goa"
          />
        </div>

        {/* 3. State Dropdown */}
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">State / Union Territory *</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {INDIAN_STATES.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Country (Fixed to India) */}
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">Country</Label>
          <Input
            name="country_display"
            value="India"
            readOnly
            disabled
            className="bg-slate-100 dark:bg-slate-800 text-foreground font-semibold cursor-not-allowed"
          />
        </div>

        {/* 5. PIN Code */}
        <div>
          <Label className="mb-1.5 font-semibold text-foreground">PIN Code (Postal Code)</Label>
          <Input
            name="pinCode"
            maxLength={6}
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="e.g. 560066"
          />
        </div>

        {/* 6. Google Maps URL */}
        <div className="sm:col-span-2">
          <Label className="mb-1.5 font-semibold text-foreground">Google Maps Link</Label>
          <div className="flex gap-2">
            <Input
              name="googleMapsUrl"
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted.includes("goo.gl") || pasted.includes("google.com/maps") || pasted.match(/\d+\.\d+,\s*\d+\.\d+/)) {
                  setTimeout(() => handleAutoDetect(pasted), 50);
                }
              }}
              placeholder="e.g. https://maps.app.goo.gl/... or https://maps.google.com/?q=..."
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDetecting || !googleMapsUrl.trim()}
              onClick={() => handleAutoDetect(googleMapsUrl)}
              className="shrink-0 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Sync Pin
            </Button>
            {googleMapsUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="shrink-0"
              >
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste Google Maps link and click Sync Pin to update map pin & coordinates.
          </p>
        </div>

        {/* Coordinates */}
        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Latitude</Label>
          <Input
            name="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g. 12.9716"
          />
        </div>
        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Longitude</Label>
          <Input
            name="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g. 77.5946"
          />
        </div>

        {/* 7. Interactive Draggable Location Map */}
        <div className="sm:col-span-2 mt-3">
          <InteractiveLocationMap
            lat={parsedLat}
            lng={parsedLng}
            onPositionChange={handleMapPositionChange}
            propertyName={address || city || "Everloft Property"}
          />
        </div>
      </div>
    </SectionFormShell>
  );
}

export function TitleForm({ propertyId, initial }: { propertyId: string; initial: { name: string; shortName: string | null } }) {
  return (
    <SectionFormShell action={saveTitleAction.bind(null, propertyId)}>
      <div>
        <Label className="mb-1.5">Property Title</Label>
        <Input name="name" required maxLength={80} defaultValue={initial.name} />
        <p className="mt-1 text-xs text-muted-foreground">Max 80 characters.</p>
      </div>
      <div>
        <Label className="mb-1.5">Short Name (internal)</Label>
        <Input name="shortName" maxLength={50} defaultValue={initial.shortName ?? undefined} />
      </div>
    </SectionFormShell>
  );
}

export function DescriptionForm({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: { description: string | null; shortDescription: string | null };
}) {
  return (
    <SectionFormShell action={saveDescriptionAction.bind(null, propertyId)}>
      <div>
        <Label className="mb-1.5">About this place</Label>
        <Textarea name="description" rows={5} required defaultValue={initial.description ?? undefined} />
      </div>
      <div>
        <Label className="mb-1.5">Short Description</Label>
        <Textarea name="shortDescription" rows={2} maxLength={300} defaultValue={initial.shortDescription ?? undefined} />
      </div>
    </SectionFormShell>
  );
}

export function HouseRulesForm({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: {
    checkInTime: string | null;
    checkOutTime: string | null;
    securityDepositAmount: number | null;
    securityDepositCurrency: string | null;
    smokingAllowed: boolean;
    petsAllowed: boolean;
    partiesAllowed: boolean;
  };
}) {
  return (
    <SectionFormShell action={saveHouseRulesAction.bind(null, propertyId)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5">Check-in Time</Label>
          <Input name="checkInTime" type="time" required defaultValue={initial.checkInTime ?? "14:00"} />
        </div>
        <div>
          <Label className="mb-1.5">Check-out Time</Label>
          <Input name="checkOutTime" type="time" required defaultValue={initial.checkOutTime ?? "11:00"} />
        </div>
        <div>
          <Label className="mb-1.5">Security Deposit</Label>
          <Input name="securityDepositAmount" type="number" min={0} defaultValue={initial.securityDepositAmount ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Currency</Label>
          <Input name="securityDepositCurrency" maxLength={3} defaultValue={initial.securityDepositCurrency ?? "INR"} />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="smokingAllowed" defaultChecked={initial.smokingAllowed} /> Allow smoking
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="petsAllowed" defaultChecked={initial.petsAllowed} /> Allow pets
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="partiesAllowed" defaultChecked={initial.partiesAllowed} /> Allow parties/events
        </label>
      </div>
    </SectionFormShell>
  );
}

export function PricingForm({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: {
    basePrice: number | null;
    weekendPrice: number | null;
    weekdayPrice: number | null;
    minNightlyPrice: number | null;
    maxNightlyPrice: number | null;
    cleaningFee: number | null;
    extraGuestFee: number | null;
    standardOccupancy: number | null;
    childFee: number | null;
    infantFee: number | null;
    petFee: number | null;
    visitorFee: number | null;
    currency: string | null;
  };
}) {
  return (
    <SectionFormShell action={savePricingAction.bind(null, propertyId)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Base Pricing (Excl. 18% GST)</p>
        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
          + 18% GST Applied at Checkout
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label className="mb-1.5">Base Price / Night (+ GST)</Label>
          <Input name="basePrice" type="number" min={0} required defaultValue={initial.basePrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Weekday Price (+ GST)</Label>
          <Input name="weekdayPrice" type="number" min={0} defaultValue={initial.weekdayPrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Weekend Price (Fri–Sat + GST)</Label>
          <Input name="weekendPrice" type="number" min={0} defaultValue={initial.weekendPrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Min Nightly Price</Label>
          <Input name="minNightlyPrice" type="number" min={0} defaultValue={initial.minNightlyPrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Max Nightly Price</Label>
          <Input name="maxNightlyPrice" type="number" min={0} defaultValue={initial.maxNightlyPrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Currency</Label>
          <Input name="currency" maxLength={3} defaultValue={initial.currency ?? "INR"} />
        </div>
      </div>

      <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guest Pricing</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label className="mb-1.5">Standard Occupancy</Label>
          <Input name="standardOccupancy" type="number" min={1} defaultValue={initial.standardOccupancy ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Extra Guest Fee</Label>
          <Input name="extraGuestFee" type="number" min={0} defaultValue={initial.extraGuestFee ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Cleaning Fee</Label>
          <Input name="cleaningFee" type="number" min={0} defaultValue={initial.cleaningFee ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Child Fee</Label>
          <Input name="childFee" type="number" min={0} defaultValue={initial.childFee ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Infant Fee</Label>
          <Input name="infantFee" type="number" min={0} defaultValue={initial.infantFee ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Pet Fee</Label>
          <Input name="petFee" type="number" min={0} defaultValue={initial.petFee ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Visitor Fee</Label>
          <Input name="visitorFee" type="number" min={0} defaultValue={initial.visitorFee ?? undefined} />
        </div>
      </div>
    </SectionFormShell>
  );
}

export function AvailabilityForm({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: {
    minStayNights: number | null;
    maxStayNights: number | null;
    advanceNoticeHours: number | null;
    instantBook: boolean;
    sameDayBookingAllowed: boolean;
    sameDayCutoffTime: string | null;
  };
}) {
  return (
    <SectionFormShell action={saveAvailabilityAction.bind(null, propertyId)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stay Rules</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5">Minimum Stay (nights)</Label>
          <Input name="minStayNights" type="number" min={1} defaultValue={initial.minStayNights ?? 1} />
        </div>
        <div>
          <Label className="mb-1.5">Maximum Stay (nights)</Label>
          <Input name="maxStayNights" type="number" min={1} defaultValue={initial.maxStayNights ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Advance Notice (hours)</Label>
          <Input name="advanceNoticeHours" type="number" min={0} defaultValue={initial.advanceNoticeHours ?? 24} />
        </div>
        <div>
          <Label className="mb-1.5">Same-day Cutoff Time</Label>
          <Input name="sameDayCutoffTime" type="time" defaultValue={initial.sameDayCutoffTime ?? undefined} />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="instantBook" defaultChecked={initial.instantBook} /> Enable Instant Book
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="sameDayBookingAllowed" defaultChecked={initial.sameDayBookingAllowed} /> Allow same-day booking
        </label>
      </div>
    </SectionFormShell>
  );
}

export function GuestRequirementsForm({
  propertyId,
  initial,
}: {
  propertyId: string;
  initial: { checkInMethod: string; requiresGovernmentId: boolean; requiresGoodReviews: boolean; requiresHostApproval: boolean };
}) {
  return (
    <SectionFormShell action={saveGuestRequirementsAction.bind(null, propertyId)}>
      <div>
        <Label className="mb-1.5">Check-in Method</Label>
        <Select name="checkInMethod" defaultValue={initial.checkInMethod}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="host_greeting">Host Greeting</SelectItem>
            <SelectItem value="self_check_in">Self Check-in</SelectItem>
            <SelectItem value="smart_lock">Smart Lock</SelectItem>
            <SelectItem value="lockbox">Lockbox</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="requiresGovernmentId" defaultChecked={initial.requiresGovernmentId} /> Require government ID
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="requiresGoodReviews" defaultChecked={initial.requiresGoodReviews} /> Require good review history
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="requiresHostApproval" defaultChecked={initial.requiresHostApproval} /> Require host approval before booking
        </label>
      </div>
    </SectionFormShell>
  );
}
