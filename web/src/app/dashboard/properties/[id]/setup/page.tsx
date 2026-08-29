import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Home, MapPin, ImageIcon, Video, Type, FileText, Sparkles, ShieldCheck, IndianRupee, CalendarClock, Users, ArrowLeft, ChevronRight } from "lucide-react";
import { getDashboardSession } from "@/lib/dashboard/session";
import { getOnboardingSnapshot, getOnboardingFormData } from "@/features/properties/services/onboarding.service";
import { ProgressRing } from "@/components/dashboard/properties/setup/progress-ring";
import { SetupCard } from "@/components/dashboard/properties/setup/setup-card";
import { ReadinessScoreCard } from "@/components/dashboard/properties/setup/readiness-score-card";
import { AiCoachCard } from "@/components/dashboard/properties/setup/ai-coach-card";
import { LivePreviewCard } from "@/components/dashboard/properties/setup/live-preview-card";
import { RequiredVsRecommendedCard } from "@/components/dashboard/properties/setup/required-vs-recommended-card";
import { SetupHeaderActions } from "@/components/dashboard/properties/setup/setup-header-actions";
import { EditableTitle } from "@/components/dashboard/properties/setup/editable-title";
import { PhotosManager } from "@/components/dashboard/properties/setup/photos-manager";
import { VideosManager } from "@/components/dashboard/properties/setup/videos-manager";
import { AmenitiesForm } from "@/components/dashboard/properties/setup/amenities-form";
import { HouseRulesPresets } from "@/components/dashboard/properties/setup/house-rules-presets";
import { DiscountsManager, FeesManager, TaxesManager } from "@/components/dashboard/properties/setup/pricing-extras";
import { PropertyCalendarManager } from "@/components/dashboard/properties/property-calendar-manager";
import {
  BasicsForm,
  LocationForm,
  TitleForm,
  DescriptionForm,
  HouseRulesForm,
  PricingForm,
  AvailabilityForm,
  GuestRequirementsForm,
} from "@/components/dashboard/properties/setup/section-forms";

const SECTION_ICONS = {
  basics: <Home className="h-5 w-5" />,
  location: <MapPin className="h-5 w-5" />,
  photos: <ImageIcon className="h-5 w-5" />,
  videos: <Video className="h-5 w-5" />,
  title: <Type className="h-5 w-5" />,
  description: <FileText className="h-5 w-5" />,
  amenities: <Sparkles className="h-5 w-5" />,
  houseRules: <ShieldCheck className="h-5 w-5" />,
  pricing: <IndianRupee className="h-5 w-5" />,
  availability: <CalendarClock className="h-5 w-5" />,
  guestRequirements: <Users className="h-5 w-5" />,
} as const;

export default async function PropertySetupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getDashboardSession();
  if (!session) redirect("/login");
  if (!session.permissions.includes("edit_property") && !session.permissions.includes("manage_properties")) {
    redirect(`/dashboard/properties/${(await params).id}`);
  }

  const { id } = await params;
  const [snapshot, formData] = await Promise.all([getOnboardingSnapshot(id), getOnboardingFormData(id)]);
  if (!snapshot || !formData) notFound();

  const {
    property,
    pricing,
    settings,
    smokingAllowed,
    petsAllowed,
    partiesAllowed,
    selectedAmenityIds,
    photos,
    videos,
    coverPhotoUrl,
    types,
    categories,
    amenityMaster,
    discounts,
    fees,
    taxes,
  } = formData;

  const requiredTotal = snapshot.sections.filter((s) => s.required).length;
  const requiredDone = snapshot.sections.filter((s) => s.required && s.completionPercent === 100).length;
  const recommendedTotal = snapshot.sections.filter((s) => !s.required).length;
  const recommendedDone = snapshot.sections.filter((s) => !s.required && s.completionPercent === 100).length;

  const sectionContent: Record<string, React.ReactNode> = {
    basics: (
      <BasicsForm
        propertyId={id}
        types={types}
        categories={categories}
        initial={{ typeId: property.type_id, categoryId: property.category_id, maxGuests: property.max_guests, bedrooms: property.bedrooms, bathrooms: property.bathrooms }}
      />
    ),
    location: (
      <LocationForm
        propertyId={id}
        initial={{
          country: property.country,
          state: property.state,
          city: property.city,
          address: property.address,
          pinCode: property.pin_code,
          latitude: property.latitude,
          longitude: property.longitude,
          googleMapsUrl: property.google_maps_url,
        }}
      />
    ),
    photos: (
      <PhotosManager
        propertyId={id}
        photos={photos}
        bedrooms={property.bedrooms ?? 1}
        bathrooms={property.bathrooms ?? 1}
        initialRoomSpecs={formData.roomSpecs}
        savedCustomSpaces={formData.savedCustomSpaces}
      />
    ),
    videos: <VideosManager propertyId={id} videos={videos} />,
    title: <TitleForm propertyId={id} initial={{ name: property.name, shortName: property.short_name }} />,
    description: <DescriptionForm propertyId={id} initial={{ description: property.description, shortDescription: property.short_description }} />,
    amenities: <AmenitiesForm propertyId={id} allAmenities={amenityMaster} selectedIds={selectedAmenityIds} />,
    houseRules: (
      <>
        <HouseRulesForm
          propertyId={id}
          initial={{
            checkInTime: property.check_in_time ? property.check_in_time.slice(0, 5) : "14:00",
            checkOutTime: property.check_out_time ? property.check_out_time.slice(0, 5) : "11:00",
            securityDepositAmount: property.security_deposit_amount,
            securityDepositCurrency: property.security_deposit_currency,
            smokingAllowed,
            petsAllowed,
            partiesAllowed,
          }}
        />
        <HouseRulesPresets propertyId={id} initialPresets={formData.presetRuleTexts} initialCustomRules={formData.customRuleTexts} />
      </>
    ),
    pricing: (
      <>
        <PricingForm
          propertyId={id}
          initial={{
            basePrice: pricing?.base_price ?? null,
            weekendPrice: pricing?.weekend_price ?? null,
            weekdayPrice: pricing?.weekday_price ?? null,
            minNightlyPrice: pricing?.min_nightly_price ?? null,
            maxNightlyPrice: pricing?.max_nightly_price ?? null,
            cleaningFee: pricing?.cleaning_fee ?? null,
            extraGuestFee: pricing?.extra_guest_fee ?? null,
            standardOccupancy: pricing?.standard_occupancy ?? null,
            childFee: pricing?.child_fee ?? null,
            infantFee: pricing?.infant_fee ?? null,
            petFee: pricing?.pet_fee ?? null,
            visitorFee: pricing?.visitor_fee ?? null,
            currency: pricing?.currency ?? "INR",
          }}
        />
        <DiscountsManager propertyId={id} discounts={discounts} />
        <FeesManager propertyId={id} fees={fees} />
        <TaxesManager propertyId={id} taxes={taxes} />
      </>
    ),
    availability: (
      <div className="space-y-6">
        <AvailabilityForm
          propertyId={id}
          initial={{
            minStayNights: settings?.min_stay_nights ?? 1,
            maxStayNights: settings?.max_stay_nights ?? null,
            advanceNoticeHours: settings?.advance_notice_hours ?? 24,
            instantBook: settings?.instant_book ?? false,
            sameDayBookingAllowed: settings?.same_day_booking_allowed ?? true,
            sameDayCutoffTime: settings?.same_day_cutoff_time ?? null,
          }}
        />
        <div className="border-t border-border pt-6">
          <PropertyCalendarManager
            propertyId={id}
            propertySlug={property.slug}
            propertyName={property.name}
          />
        </div>
      </div>
    ),
    guestRequirements: (
      <GuestRequirementsForm
        propertyId={id}
        initial={{
          checkInMethod: settings?.check_in_method ?? "host_greeting",
          requiresGovernmentId: settings?.requires_government_id ?? false,
          requiresGoodReviews: settings?.requires_good_reviews ?? false,
          requiresHostApproval: settings?.requires_host_approval ?? false,
        }}
      />
    ),
  };

  return (
    <div className="space-y-6">
      {/* Top Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/properties" className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Properties
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="font-semibold text-primary">{property.name}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span>Setup Dashboard</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
            <div>
              <p className="eyebrow mb-1">Property Setup Dashboard</p>
              <EditableTitle propertyId={id} initialName={property.name} />
              <p className="mt-1 text-sm text-muted-foreground">Complete your property information to start receiving bookings.</p>
            </div>
            <SetupHeaderActions propertyId={id} canPublish={snapshot.canPublish} />
          </div>

        <div className="mb-6 flex flex-wrap items-center gap-8 rounded-2xl border border-border bg-card p-6">
          <ProgressRing percent={snapshot.overallCompletionPercent} label="Property Complete" size={128} />
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Required</p>
              <p className="text-sm font-bold text-destructive">{snapshot.requiredRemaining} Remaining</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recommended</p>
              <p className="text-sm font-bold text-gold">{snapshot.recommendedRemaining} Remaining</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Readiness Score</p>
              <p className="text-sm font-bold text-primary">{snapshot.readinessScore}/100</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Edited</p>
              <p className="text-sm font-bold text-primary">{formatDistanceToNow(new Date(snapshot.lastEditedAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {snapshot.sections.map((section) => {
            return (
              <SetupCard
                key={section.key}
                icon={SECTION_ICONS[section.key]}
                title={section.label}
                description={section.description}
                completionPercent={section.completionPercent}
                status={section.status}
                required={section.required}
                fieldsCompleted={section.fieldsCompleted}
                fieldsTotal={section.fieldsTotal}
              >
                {sectionContent[section.key]}
              </SetupCard>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <LivePreviewCard
          coverPhotoUrl={coverPhotoUrl}
          name={property.name}
          typeName={types.find((t) => t.id === property.type_id)?.name ?? null}
          categoryName={categories.find((c) => c.id === property.category_id)?.name ?? null}
          city={property.city}
          state={property.state}
          country={property.country}
          pinCode={property.pin_code}
          maxGuests={property.max_guests}
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          basePrice={pricing?.base_price ?? null}
          currency={pricing?.currency ?? "INR"}
          cleaningFee={pricing?.cleaning_fee ?? null}
        />
        <ReadinessScoreCard score={snapshot.readinessScore} breakdown={snapshot.readinessBreakdown} />
        <RequiredVsRecommendedCard
          requiredDone={requiredDone}
          requiredTotal={requiredTotal}
          recommendedDone={recommendedDone}
          recommendedTotal={recommendedTotal}
        />
        <AiCoachCard recommendations={snapshot.coach} />
      </div>
    </div>
    </div>
  );
}
