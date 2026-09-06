import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicPropertyCard } from "./public-property-card";
import type { PublicPropertyListItem } from "@/features/properties/types/property.types";

vi.mock("next/image", () => ({
  default: ({ alt, fill: _fill, unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const property: PublicPropertyListItem = {
  id: "property-305",
  slug: "305-stylish-2bhk-by-everloft-with-balcony",
  name: "305 | Stylish 2BHK by Everloft with Balcony",
  city: "Bengaluru",
  area: "Whitefield",
  typeName: "Apartment",
  bedrooms: 2,
  bathrooms: 2,
  maxGuests: 5,
  currency: "INR",
  nightlyPrice: 2500,
  coverImageUrl: "https://example.com/cover.jpg",
  thumbnailUrl: "https://example.com/thumb.jpg",
};

afterEach(cleanup);

describe("PublicPropertyCard", () => {
  it("renders the listing details, GST disclosure, and property links", () => {
    render(<PublicPropertyCard property={property} />);

    expect(screen.getAllByRole("link", { name: property.name })[1]).toHaveAttribute(
      "href",
      `/properties/${property.slug}`,
    );
    expect(screen.getByText("Whitefield, Bengaluru")).toBeInTheDocument();
    expect(screen.getByText("2 BHK")).toBeInTheDocument();
    expect(screen.getByText("5 Guests")).toBeInTheDocument();
    expect(screen.getByText("2 Baths")).toBeInTheDocument();
    expect(screen.getByText("+ GST")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Stay" })).toHaveAttribute(
      "href",
      `/properties/${property.slug}`,
    );
  });

  it("toggles the wishlist state without navigating", () => {
    render(<PublicPropertyCard property={property} />);

    const wishlist = screen.getByRole("button", { name: "Add to wishlist" });
    expect(wishlist.querySelector("svg")).not.toHaveClass("fill-red-500");

    fireEvent.click(wishlist);

    expect(wishlist.querySelector("svg")).toHaveClass("fill-red-500");
  });

  it("uses the pricing-on-request state when the nightly price is unavailable", () => {
    render(<PublicPropertyCard property={{ ...property, nightlyPrice: null }} />);

    expect(screen.getByText("Pricing on request")).toBeInTheDocument();
    expect(screen.queryByText("+ GST")).not.toBeInTheDocument();
  });
});
