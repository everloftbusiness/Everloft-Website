import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everloft.co.in";

const STATIC_ROUTES = [
  "",
  "/properties",
  "/about",
  "/property-management",
  "/investor-program",
  "/contact",
  "/faq",
  "/login",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    if (!process.env.SUPABASE_SECRET_KEY) {
      return staticEntries;
    }

    const supabase = createAdminClient();
    const { data: activeStatus, error: statusError } = await supabase
      .from("property_status")
      .select("id")
      .eq("slug", "active")
      .maybeSingle();
    if (statusError || !activeStatus) return staticEntries;

    const { data: properties } = await supabase
      .from("properties")
      .select("slug, updated_at")
      .eq("status_id", activeStatus.id)
      .is("deleted_at", null);

    if (!properties || properties.length === 0) {
      return staticEntries;
    }

    const propertyEntries: MetadataRoute.Sitemap = properties
      .filter((p) => Boolean(p.slug))
      .map((p) => ({
        url: `${siteUrl}/properties/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    return [...staticEntries, ...propertyEntries];
  } catch {
    return staticEntries;
  }
}
