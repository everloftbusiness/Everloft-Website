import type { Metadata } from "next";
import { HeroBackdrop } from "@/components/site/hero-backdrop";
import { HeroSearchBar } from "@/components/site/hero-search-bar";
import { PropertiesToolbar } from "@/components/property/properties-toolbar";
import { PropertyFilters } from "@/components/property/property-filters";
import { ActiveFilterChips } from "@/components/property/active-filter-chips";
import { PropertiesMapView } from "@/components/property/properties-map-view";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PublicPropertyCard, listPublicActiveProperties } from "@/features/properties";

export const metadata: Metadata = {
  title: "Properties",
  description:
    "Browse Everloft's curated collection of luxury villas, apartments, boutique stays, and holiday homes — every one professionally managed.",
};

const PAGE_SIZE = 6;

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function PropertiesPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (props.searchParams ? await props.searchParams : {}) ?? {};
  const get = (key: string) => {
    const val = params[key];
    return Array.isArray(val) ? val[0] : val;
  };

  const allActiveProperties = await listPublicActiveProperties(100);
  const cities = [...new Set(allActiveProperties.map((property) => property.city).filter((city): city is string => Boolean(city)))].sort();
  const types = [...new Set(allActiveProperties.map((property) => property.typeName).filter((type): type is string => Boolean(type)))].sort();

  // Dynamic Min and Max price bounds from active listings
  const validPrices = allActiveProperties.map((p) => p.nightlyPrice).filter((price): price is number => Boolean(price) && price > 0);
  const minPriceFloor = validPrices.length > 0 ? Math.min(...validPrices) : 1000;
  const maxPriceFloor = validPrices.length > 0 ? Math.max(...validPrices) : 70000;

  const city = get("city");
  const type = get("type");
  const guests = get("guests") ? Number(get("guests")) : undefined;
  const bedrooms = get("bedrooms") ? Number(get("bedrooms")) : undefined;
  const maxPrice = get("maxPrice") ? Number(get("maxPrice")) : undefined;
  const selectedAmenities = get("amenities") ? (get("amenities") as string).split(",").filter(Boolean) : [];
  const sort = get("sort") ?? "recommended";

  const allProperties = allActiveProperties
    .filter((property) => !city || property.city === city)
    .filter((property) => !type || property.typeName === type)
    .filter((property) => !guests || (property.maxGuests ?? 0) >= guests)
    .filter((property) => !bedrooms || (property.bedrooms ?? 0) >= bedrooms)
    .filter((property) => !maxPrice || (property.nightlyPrice !== null && property.nightlyPrice <= maxPrice))
    .filter((property) => {
      if (selectedAmenities.length === 0) return true;
      const propAmenities = property.amenities || [];
      return selectedAmenities.every((tag) =>
        propAmenities.some((a) => a.toLowerCase().includes(tag.toLowerCase()))
      );
    })
    .sort((left, right) => {
      if (sort === "price-asc") return (left.nightlyPrice ?? Number.POSITIVE_INFINITY) - (right.nightlyPrice ?? Number.POSITIVE_INFINITY);
      if (sort === "price-desc") return (right.nightlyPrice ?? -1) - (left.nightlyPrice ?? -1);
      return 0;
    });

  const view = get("view") === "map" ? "map" : "grid";
  const page = Math.max(1, Number(get("page")) || 1);
  const totalPages = Math.max(1, Math.ceil(allProperties.length / PAGE_SIZE));
  const pageItems = allProperties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const baseParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (k === "page" || !v) return;
    baseParams.set(k, Array.isArray(v) ? v[0] : v);
  });

  return (
    <>
      <section className="relative flex min-h-[52vh] items-center overflow-hidden pt-28 pb-14">
        <HeroBackdrop />
        <div className="site-container relative z-10">
          <Reveal>
            <p className="eyebrow mb-5 justify-center text-center">Our Collection</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-center text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Every property, professionally managed
            </h1>
          </Reveal>
          <Reveal delay={0.12} className="mx-auto mt-9 max-w-4xl">
            <HeroSearchBar cities={cities} />
          </Reveal>
        </div>
      </section>

      <section className="section-padding-tight">
        <div className="site-container grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-6 text-sm font-bold uppercase tracking-wide text-primary">
                Filters
              </h2>
              <PropertyFilters cities={cities} types={types} minPrice={minPriceFloor} maxPrice={maxPriceFloor} />
            </div>
          </aside>

          <div>
            <PropertiesToolbar
              resultCount={allProperties.length}
              cities={cities}
              types={types}
              maxPrice={maxPriceFloor}
              view={view}
            />

            <ActiveFilterChips maxPriceFloor={maxPriceFloor} />

            <div className="mt-6">
              {view === "map" ? (
                <PropertiesMapView properties={allProperties} />
              ) : pageItems.length > 0 ? (
                <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {pageItems.map((property) => (
                    <RevealItem key={property.id}>
                      <PublicPropertyCard property={property} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              ) : (
                <div className="rounded-2xl border border-dashed border-border py-24 text-center">
                  <p className="text-lg font-semibold text-primary">No properties match your filters</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try widening your search or resetting the filters.
                  </p>
                </div>
              )}
            </div>

            {view === "grid" && totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/properties?${baseParams.toString()}${baseParams.toString() ? "&" : ""}page=${Math.max(1, page - 1)}`}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href={`/properties?${baseParams.toString()}${baseParams.toString() ? "&" : ""}page=${i + 1}`}
                        isActive={page === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href={`/properties?${baseParams.toString()}${baseParams.toString() ? "&" : ""}page=${Math.min(totalPages, page + 1)}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
