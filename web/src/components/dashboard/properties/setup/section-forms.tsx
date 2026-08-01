"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "@/features/properties/actions/onboarding.actions";

type LookupOption = { id: string; name: string };

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
  return (
    <SectionFormShell action={saveBasicsAction.bind(null, propertyId)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5">Property Type</Label>
          <Select name="typeId" required defaultValue={initial.typeId ?? undefined}>
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
          <Label className="mb-1.5">Category</Label>
          <Select name="categoryId" defaultValue={initial.categoryId ?? undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
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
          <Label className="mb-1.5">Bedrooms</Label>
          <Input name="bedrooms" type="number" min={0} required defaultValue={initial.bedrooms ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Bathrooms</Label>
          <Input name="bathrooms" type="number" min={0} required defaultValue={initial.bathrooms ?? undefined} />
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
  initial: { country: string; state: string | null; city: string | null; address: string | null; latitude: number | null; longitude: number | null; googleMapsUrl: string | null };
}) {
  return (
    <SectionFormShell action={saveLocationAction.bind(null, propertyId)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5">Country</Label>
          <Input name="country" required defaultValue={initial.country} />
        </div>
        <div>
          <Label className="mb-1.5">State</Label>
          <Input name="state" defaultValue={initial.state ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">City</Label>
          <Input name="city" required defaultValue={initial.city ?? undefined} />
        </div>
        <div className="col-span-2">
          <Label className="mb-1.5">Address</Label>
          <Input name="address" required defaultValue={initial.address ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Latitude</Label>
          <Input name="latitude" type="number" step="any" defaultValue={initial.latitude ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Longitude</Label>
          <Input name="longitude" type="number" step="any" defaultValue={initial.longitude ?? undefined} />
        </div>
        <div className="col-span-2">
          <Label className="mb-1.5">Google Maps URL</Label>
          <Input name="googleMapsUrl" type="url" defaultValue={initial.googleMapsUrl ?? undefined} />
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
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Base Pricing</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label className="mb-1.5">Base Price / Night</Label>
          <Input name="basePrice" type="number" min={0} required defaultValue={initial.basePrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Weekday Price</Label>
          <Input name="weekdayPrice" type="number" min={0} defaultValue={initial.weekdayPrice ?? undefined} />
        </div>
        <div>
          <Label className="mb-1.5">Weekend Price (Fri–Sat)</Label>
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
