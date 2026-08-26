import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching Airbnb listing HTML for live dynamic photo taglines...");
  const res = await fetch("https://www.airbnb.co.in/rooms/1402181733992588218?locale=en", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
  });

  const html = await res.text();
  const filenameTaglineMap = new Map<string, { tagline: string; spaceTag: string }>();

  const deferredMatch = html.match(/<script id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/) ||
                        html.match(/<script id="data-injector-instances"[^>]*>([\s\S]*?)<\/script>/);

  if (deferredMatch) {
    try {
      const json = JSON.parse(deferredMatch[1]);

      function traverse(obj: unknown) {
        if (!obj) return;
        if (typeof obj === "object") {
          if (Array.isArray(obj)) {
            for (const item of obj) traverse(item);
          } else {
            const rec = obj as Record<string, unknown>;
            if (rec.baseUrl || rec.picture || rec.largeUrl || rec.original) {
              const photoUrl = (rec.baseUrl || rec.picture || rec.largeUrl || rec.original) as string;
              const tagline = (rec.caption || rec.accessibilityLabel || rec.title || rec.alt || "") as string;

              if (typeof photoUrl === "string" && photoUrl.includes("muscache.com")) {
                const filename = photoUrl.split('/').pop()?.split('?')[0];
                if (filename && tagline) {
                  let spaceTag = "Living Room";
                  const tagLower = tagline.toLowerCase();

                  if (tagLower.includes("bedroom 1")) spaceTag = "Bedroom 1";
                  else if (tagLower.includes("bedroom 2")) spaceTag = "Bedroom 2";
                  else if (tagLower.includes("bedroom 3")) spaceTag = "Bedroom 3";
                  else if (tagLower.includes("kitchen")) spaceTag = "Kitchen";
                  else if (tagLower.includes("dining")) spaceTag = "Dining Area";
                  else if (tagLower.includes("bathroom")) spaceTag = "Bathroom";
                  else if (tagLower.includes("balcony")) spaceTag = "Balcony";
                  else if (tagLower.includes("exterior")) spaceTag = "Exterior";
                  else if (tagLower.includes("living")) spaceTag = "Living Room";

                  filenameTaglineMap.set(filename, { tagline, spaceTag });
                }
              }
            }
            for (const k in rec) traverse(rec[k]);
          }
        }
      }

      traverse(json);
    } catch {}
  }

  console.log(`Parsed ${filenameTaglineMap.size} dynamic photo taglines from Airbnb HTML!`);

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, slug")
    .is("deleted_at", null);

  if (!properties) return;

  for (const p of properties) {
    if (p.name.includes("Electronic City") || p.name.includes("3BHK")) {
      const { data: photos } = await supabase
        .from("property_photos")
        .select("id, file_id, sort_order")
        .eq("property_id", p.id)
        .is("deleted_at", null);

      if (!photos || photos.length === 0) continue;

      const fileIds = photos.map(ph => ph.file_id);
      const { data: files } = await supabase
        .from("files")
        .select("id, public_url, object_key")
        .in("id", fileIds);

      const fileMap = new Map((files || []).map(f => [f.id, f]));

      let updatedCount = 0;
      for (const ph of photos) {
        const file = fileMap.get(ph.file_id);
        if (!file) continue;

        const url = file.public_url || "";
        const objKey = file.object_key || "";

        let match: { tagline: string; spaceTag: string } | undefined = undefined;
        for (const [fn, meta] of filenameTaglineMap.entries()) {
          const fnNoExt = fn.split('.')[0];
          if (url.includes(fnNoExt) || objKey.includes(fnNoExt)) {
            match = meta;
            break;
          }
        }

        if (match) {
          await supabase.from("property_photos").update({
            tags: [match.spaceTag],
            caption: match.tagline,
          }).eq("id", ph.id);
          updatedCount++;
        }
      }
      console.log(`  Dynamically matched & updated ${updatedCount} photos for Property: ${p.name} (${p.id})`);
    }
  }

  console.log("\n🎉 Dynamic photo tagline mapping completed!");
}

main();
