import { prisma } from "@/lib/prisma";
import type { Property, PropertyImage, Review } from "@/generated/prisma/client";

export type PropertyView = Omit<
  Property,
  "amenities" | "highlights" | "houseRules" | "nearbyPlaces"
> & {
  amenities: string[];
  highlights: string[];
  houseRules: string[];
  nearbyPlaces: { name: string; distance: string }[];
  images: PropertyImage[];
  reviews: Review[];
};

function mapProperty(
  property: Property & { images?: PropertyImage[]; reviews?: Review[] }
): PropertyView {
  return {
    ...property,
    amenities: JSON.parse(property.amenities) as string[],
    highlights: JSON.parse(property.highlights) as string[],
    houseRules: JSON.parse(property.houseRules) as string[],
    nearbyPlaces: JSON.parse(property.nearbyPlaces) as {
      name: string;
      distance: string;
    }[],
    images: property.images ?? [],
    reviews: property.reviews ?? [],
  };
}

export async function getFeaturedProperties(limit = 6) {
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED", featured: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { rating: "desc" },
    take: limit,
  });
  return properties.map(mapProperty);
}

export type PropertyFilters = {
  city?: string;
  type?: string;
  guests?: number;
  bedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: "price-asc" | "price-desc" | "rating" | "recommended";
};

export async function getProperties(filters: PropertyFilters = {}) {
  const properties = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.guests ? { guests: { gte: filters.guests } } : {}),
      ...(filters.bedrooms ? { bedrooms: { gte: filters.bedrooms } } : {}),
      ...(filters.minPrice ? { pricePerNight: { gte: filters.minPrice } } : {}),
      ...(filters.maxPrice ? { pricePerNight: { lte: filters.maxPrice } } : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  let mapped = properties.map(mapProperty);

  if (filters.amenities && filters.amenities.length > 0) {
    mapped = mapped.filter((p) =>
      filters.amenities!.every((tag) =>
        p.amenities.some((a) => a.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }

  switch (filters.sort) {
    case "price-asc":
      mapped.sort((a, b) => a.pricePerNight - b.pricePerNight);
      break;
    case "price-desc":
      mapped.sort((a, b) => b.pricePerNight - a.pricePerNight);
      break;
    case "rating":
      mapped.sort((a, b) => b.rating - a.rating);
      break;
    default:
      mapped.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }

  return mapped;
}

export async function getPropertyBySlug(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!property) return null;
  return mapProperty(property);
}

export async function getSimilarProperties(current: PropertyView, limit = 3) {
  const properties = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      slug: { not: current.slug },
      OR: [{ city: current.city }, { type: current.type }],
    },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    take: limit,
  });
  return properties.map(mapProperty);
}

export async function getCities() {
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { city: true },
    distinct: ["city"],
  });
  return properties.map((p) => p.city).sort();
}

export async function getTopReviews(limit = 6) {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 } },
    include: {
      property: {
        select: {
          name: true,
          slug: true,
          city: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { rating: "desc" },
    take: limit,
  });
  return reviews;
}

export async function getPropertyTypes() {
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED" },
    select: { type: true },
    distinct: ["type"],
  });
  return properties.map((p) => p.type);
}
