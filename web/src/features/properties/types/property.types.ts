export type PropertyListItem = {
  id: string;
  name: string;
  slug: string;
  internalCode: string | null;
  city: string | null;
  typeName: string | null;
  statusSlug: string | null;
  statusName: string | null;
  ownerName: string | null;
  managerName: string | null;
  maxGuests: number | null;
};

export type PropertyDetail = PropertyListItem & {
  country: string;
  state: string | null;
  address: string | null;
  description: string | null;
  shortDescription: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  currency: string;
  typeId: string | null;
  statusId: string | null;
  categoryId: string | null;
  ownerId: string | null;
  managedBy: string | null;
  createdAt: string;
};

export type LookupOption = { id: string; slug: string; name: string };
export type OwnerOption = { id: string; name: string };

/** Safe, guest-facing subset of an approved property record. */
export type PublicPropertyListItem = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  area: string | null;
  typeName: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  currency: string;
  nightlyPrice: number | null;
  coverImageUrl: string | null;
};

export type PublicPropertyDetail = PublicPropertyListItem & {
  address: string | null;
  description: string | null;
  highlights: string[];
  propertyAreaSqft: number | null;
  amenities: string[];
  photos: { url: string; alt: string }[];
};
