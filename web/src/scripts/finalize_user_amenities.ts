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

// Finalized Amenity List provided by the user
const FINAL_AMENITIES: { name: string; category: string }[] = [
  // 1. Power Backup & Utilities
  { name: "Generator", category: "smart_home" },
  { name: "UPS Backup", category: "smart_home" },

  // 2. Internet & Workspace
  { name: "High-speed Wi-Fi", category: "internet_office" },
  { name: "Dedicated Workspace", category: "internet_office" },

  // 3. Bedroom
  { name: "King Bed", category: "bedroom" },
  { name: "Queen Bed", category: "bedroom" },
  { name: "Double Bed", category: "bedroom" },
  { name: "Single Bed", category: "bedroom" },
  { name: "Sofa Bed", category: "bedroom" },
  { name: "Bed Linen & Sheets", category: "bedroom" },
  { name: "Extra Pillows & Blankets", category: "bedroom" },
  { name: "Wardrobe & Closet", category: "bedroom" },
  { name: "Hangers", category: "bedroom" },
  { name: "Nightstand", category: "bedroom" },
  { name: "Reading Lamp", category: "bedroom" },
  { name: "Blackout Curtains", category: "bedroom" },
  { name: "Floor Mattress", category: "bedroom" },
  { name: "Baby Cot", category: "bedroom" },
  { name: "Crib", category: "bedroom" },
  { name: "Travel Cot", category: "bedroom" },
  { name: "Pet Bed", category: "bedroom" },

  // 4. Bathroom
  { name: "Shampoo", category: "bathroom" },
  { name: "Conditioner", category: "bathroom" },
  { name: "Body Soap", category: "bathroom" },
  { name: "Shower Gel", category: "bathroom" },
  { name: "Hand Soap", category: "bathroom" },
  { name: "Towels", category: "bathroom" },
  { name: "Toilet Paper", category: "bathroom" },
  { name: "Bathtub", category: "bathroom" },
  { name: "Jacuzzi", category: "bathroom" },
  { name: "Hot Tub", category: "bathroom" },
  { name: "Sauna", category: "bathroom" },
  { name: "Steam Room", category: "bathroom" },
  { name: "Bidet", category: "bathroom" },
  { name: "Shower", category: "bathroom" },
  { name: "Hairdryer", category: "bathroom" },
  { name: "Geyser & Hot Water", category: "bathroom" },
  { name: "Cleaning Products", category: "bathroom" },
  { name: "Accessible Bathroom", category: "bathroom" },
  { name: "Roll-in Shower", category: "bathroom" },
  { name: "Shower Chair", category: "bathroom" },
  { name: "Grab Bars", category: "bathroom" },

  // 5. Kitchen & Dining
  { name: "Kitchenette", category: "kitchen_dining" },
  { name: "Refrigerator & Freezer", category: "kitchen_dining" },
  { name: "Microwave", category: "kitchen_dining" },
  { name: "Oven", category: "kitchen_dining" },
  { name: "Toaster", category: "kitchen_dining" },
  { name: "Gas Stove", category: "kitchen_dining" },
  { name: "Induction Cooktop", category: "kitchen_dining" },
  { name: "Coffee Machine", category: "kitchen_dining" },
  { name: "Electric Kettle", category: "kitchen_dining" },
  { name: "Mixer Grinder", category: "kitchen_dining" },
  { name: "Rice Cooker", category: "kitchen_dining" },
  { name: "Cooking Basics", category: "kitchen_dining" },
  { name: "Cookware", category: "kitchen_dining" },
  { name: "Frying Pan", category: "kitchen_dining" },
  { name: "Tawa", category: "kitchen_dining" },
  { name: "Pressure Cooker", category: "kitchen_dining" },
  { name: "Indian Cooking Utensils", category: "kitchen_dining" },
  { name: "Crockery & Cutlery", category: "kitchen_dining" },
  { name: "Water Purifier", category: "kitchen_dining" },
  { name: "RO Water", category: "kitchen_dining" },
  { name: "Drinking Water", category: "kitchen_dining" },
  { name: "Can Water", category: "kitchen_dining" },
  { name: "Basic Spices", category: "kitchen_dining" },
  { name: "Dining Table", category: "kitchen_dining" },
  { name: "Outdoor Dining Area", category: "kitchen_dining" },

  // 6. Laundry & Washing
  { name: "Washing Machine", category: "laundry" },
  { name: "Clothes Dryer", category: "laundry" },
  { name: "Iron & Board", category: "laundry" },
  { name: "Clothes Drying Rack", category: "laundry" },
  { name: "Laundry Service Available on Request", category: "laundry" },

  // 7. Heating & Cooling
  { name: "Air Conditioning", category: "heating_cooling" },
  { name: "Ceiling Fan", category: "heating_cooling" },
  { name: "Portable Fan", category: "heating_cooling" },
  { name: "Heating", category: "heating_cooling" },
  { name: "Heater", category: "heating_cooling" },
  { name: "Solar Water Heater", category: "heating_cooling" },
  { name: "Indoor Fireplace", category: "heating_cooling" },

  // 8. Parking & Building Facilities
  { name: "Free Parking", category: "parking_building" },
  { name: "Car Parking", category: "parking_building" },
  { name: "Paid Parking", category: "parking_building" },
  { name: "Accessible Parking", category: "parking_building" },
  { name: "EV Charger", category: "parking_building" },
  { name: "Elevator / Lift", category: "parking_building" },
  { name: "Private Entrance", category: "parking_building" },
  { name: "Single-level Home", category: "parking_building" },
  { name: "Step-free Entrance", category: "parking_building" },
  { name: "Stair Gates", category: "parking_building" },
  { name: "Wide Doorway", category: "parking_building" },
  { name: "Well-lit Entrance", category: "parking_building" },

  // 9. Outdoor & Leisure
  { name: "Swimming Pool", category: "outdoor" },
  { name: "Private Pool", category: "outdoor" },
  { name: "Shared Pool", category: "outdoor" },
  { name: "Gym", category: "outdoor" },
  { name: "Balcony / Patio", category: "outdoor" },
  { name: "Terrace", category: "outdoor" },
  { name: "Balcony Seating", category: "outdoor" },
  { name: "Outdoor Furniture", category: "outdoor" },
  { name: "Garden / Lawn", category: "outdoor" },
  { name: "Backyard", category: "outdoor" },
  { name: "Fenced Yard", category: "outdoor" },
  { name: "Fire Pit", category: "outdoor" },
  { name: "BBQ Grill", category: "outdoor" },
  { name: "Swing", category: "outdoor" },
  { name: "Hammock", category: "outdoor" },
  { name: "Pool Table", category: "outdoor" },
  { name: "Resort Access", category: "outdoor" },
  { name: "Mountain View", category: "outdoor" },
  { name: "Beach View", category: "outdoor" },
  { name: "Beachfront", category: "outdoor" },
  { name: "Lake View", category: "outdoor" },
  { name: "River View", category: "outdoor" },
  { name: "City Skyline View", category: "outdoor" },

  // 10. Entertainment & Games
  { name: "Smart TV", category: "entertainment" },
  { name: "Cable TV", category: "entertainment" },
  { name: "Netflix", category: "entertainment" },
  { name: "Amazon Prime Video", category: "entertainment" },
  { name: "Disney+ Hotstar", category: "entertainment" },
  { name: "Cinema & Projector", category: "entertainment" },
  { name: "Soundbar & Speakers", category: "entertainment" },
  { name: "Board Games", category: "entertainment" },
  { name: "Books & Reading Material", category: "entertainment" },
  { name: "Local Guidebook", category: "entertainment" },

  // 11. Safety & Security
  { name: "CCTV Cameras", category: "safety_security" },
  { name: "Smart Lock", category: "safety_security" },
  { name: "Digital Door Lock", category: "safety_security" },
  { name: "Lockbox", category: "safety_security" },
  { name: "Safe", category: "safety_security" },
  { name: "Security Alarm", category: "safety_security" },
  { name: "Fire Extinguisher", category: "safety_security" },
  { name: "First Aid Kit", category: "safety_security" },
  { name: "Medical Kit", category: "safety_security" },
  { name: "Emergency Contact List", category: "safety_security" },
  { name: "Outlet Covers", category: "safety_security" },
  { name: "Smoke Alarm", category: "safety_security" },
  { name: "Carbon Monoxide Alarm", category: "safety_security" },

  // 12. Guest Services
  { name: "Building Staff & Caretaker", category: "guest_services" },
  { name: "Concierge", category: "guest_services" },
  { name: "Daily Housekeeping", category: "guest_services" },
  { name: "Room Service", category: "guest_services" },
  { name: "Housekeeping Services", category: "guest_services" },
  { name: "Cleaning During Stay", category: "guest_services" },
  { name: "Self Check-in", category: "guest_services" },
  { name: "Host Greeting", category: "guest_services" },
  { name: "Airport Pickup", category: "guest_services" },
  { name: "Luggage Drop-off", category: "guest_services" },
  { name: "Pets Allowed", category: "guest_services" },
  { name: "Family Friendly", category: "guest_services" },
  { name: "High Chair", category: "guest_services" },
  { name: "Children's Toys", category: "guest_services" },
  { name: "Children's Dinnerware", category: "guest_services" },
  { name: "Long-term Stays Allowed", category: "guest_services" },
  { name: "Breakfast Included", category: "guest_services" },
  { name: "Mosquito Repellent", category: "guest_services" },
];

async function main() {
  console.log("Syncing amenity_master with User's Finalized Selection...");

  // Insert or update every item in FINAL_AMENITIES
  for (const item of FINAL_AMENITIES) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50);

    const { data: existing } = await supabase
      .from("amenity_master")
      .select("id")
      .or(`slug.eq.${slug},name.ilike.${item.name}`)
      .single();

    if (!existing) {
      console.log(`  Adding new amenity: "${item.name}" -> ${item.category}`);
      await supabase.from("amenity_master").insert({
        name: item.name,
        slug,
        category: item.category,
      });
    } else {
      await supabase.from("amenity_master").update({
        name: item.name,
        category: item.category,
      }).eq("id", existing.id);
    }
  }

  // Get count per category
  const { data: allAmenityRows } = await supabase.from("amenity_master").select("name, category");
  const counts: Record<string, number> = {};
  (allAmenityRows || []).forEach(a => {
    counts[a.category] = (counts[a.category] || 0) + 1;
  });

  console.log("\n================ SYNC COMPLETE ================");
  console.log(`Total Master Amenities in Database: ${allAmenityRows?.length || 0}`);
  console.log("Category Counts:", counts);
}

main();
