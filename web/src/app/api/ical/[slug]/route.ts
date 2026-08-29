import { NextResponse } from "next/server";
import { getPublicActivePropertyBySlug } from "@/features/properties/services/properties.service";
import { generateICalFeed, getPropertyCalendarBlocks } from "@/features/properties/services/ical-sync.service";

export async function GET(
  _request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params;
    const property = await getPublicActivePropertyBySlug(slug);

    if (!property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    const blocks = await getPropertyCalendarBlocks(property.id);
    const icsString = generateICalFeed(property.name, blocks);

    return new NextResponse(icsString, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${property.slug}-everloft.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(msg, { status: 500 });
  }
}
