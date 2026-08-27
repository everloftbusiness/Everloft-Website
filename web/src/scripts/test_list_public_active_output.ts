import { listPublicActiveProperties } from "../features/properties/services/properties.service";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
  console.log("Calling listPublicActiveProperties(6)...");

  const properties = await listPublicActiveProperties(6);
  console.log(`Returned ${properties.length} properties:`);

  properties.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] "${p.name}" (Slug: ${p.slug})`);
    console.log(`    - Price: ₹${p.nightlyPrice} + GST`);
    console.log(`    - Cover Image URL: ${p.coverImageUrl || "❌ NULL (SHOWS PHOTO COMING SOON)"}`);
  });
}

main();
