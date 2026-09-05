import { parseICalFeed, savePropertyCalendarBlocks, getPropertyCalendarBlocks } from "../features/properties/services/ical-sync.service";

async function testValidIcsParsing() {
  console.log("Testing iCal parser with valid RFC 5545 iCalendar content...");

  const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//NONSGML hcalendar-parser//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260920
DTEND;VALUE=DATE:20260925
UID:reservation_123456@airbnb.com
SUMMARY:Airbnb (Reserved)
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20261001
DTEND;VALUE=DATE:20261005
UID:reservation_789012@airbnb.com
SUMMARY:Airbnb (Reserved)
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const parsed = parseICalFeed(sampleIcs);
  console.log("Parsed Events Count:", parsed.length);
  console.log("Parsed Events:", parsed);

  const testPropertyId = "a79e4cd8-2b76-4905-910b-f51db47d128b";
  const existingBlocks = await getPropertyCalendarBlocks(testPropertyId);
  const manualBlocks = existingBlocks.filter(b => b.reason === "manual_block");

  const channelBlocks = parsed.map(p => ({
    id: `ch_ab_${p.uid}`,
    propertyId: testPropertyId,
    startDate: p.startDate,
    endDate: p.endDate,
    reason: "channel_sync" as const,
    channelName: "Airbnb",
    notes: `Airbnb: ${p.summary}`,
  }));

  await savePropertyCalendarBlocks(testPropertyId, [...manualBlocks, ...channelBlocks]);

  const updatedBlocks = await getPropertyCalendarBlocks(testPropertyId);
  console.log("\nBlocks in Supabase DB after syncing valid iCal events:", updatedBlocks);
}

testValidIcsParsing().catch(console.error);
