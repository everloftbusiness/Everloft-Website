import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type SeedProperty = {
  slug: string;
  name: string;
  type: string;
  tagline: string;
  description: string;
  city: string;
  area: string;
  address: string;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  pricePerNight: number;
  cleaningFee: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  highlights: string[];
  houseRules: string[];
  nearbyPlaces: { name: string; distance: string }[];
  featured: boolean;
  imageCount: number;
  reviews: {
    guestName: string;
    rating: number;
    title: string;
    comment: string;
    stayMonth: string;
  }[];
};

const properties: SeedProperty[] = [
  {
    slug: "villa-zephyr-assagao",
    name: "Villa Zephyr",
    type: "Villa",
    tagline: "A private sanctuary among Assagao's palms",
    description:
      "Villa Zephyr sits behind a curtain of coconut palms in Assagao, North Goa, where Portuguese-era calm meets contemporary luxury. Four ensuite bedrooms open onto a sun-drenched lawn and a 40-foot infinity pool, while an open-air living pavilion keeps the sea breeze moving through the home. Every stay is professionally managed by Everloft, from a stocked kitchen to a dedicated villa host.",
    city: "Goa",
    area: "Assagao, North Goa",
    address: "Near Assagao Village Square, North Goa, Goa 403507",
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 4200,
    pricePerNight: 42000,
    cleaningFee: 3500,
    rating: 4.96,
    reviewCount: 128,
    amenities: [
      "Private infinity pool",
      "High-speed WiFi",
      "Daily housekeeping",
      "Personal chef on request",
      "Smart TV & OTT apps",
      "Full air conditioning",
      "Dedicated parking",
      "24×7 villa host",
      "Power backup",
      "Pet friendly",
    ],
    highlights: [
      "40-ft infinity pool with sun deck",
      "5-minute walk to Assagao's cafes",
      "Outdoor rain shower garden",
      "In-house breakfast service",
    ],
    houseRules: [
      "Check-in from 2:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "Pets allowed with prior notice",
      "Quiet hours after 11:00 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Assagao Village Market", distance: "0.6 km" },
      { name: "Vagator Beach", distance: "4.2 km" },
      { name: "Goa International Airport", distance: "38 km" },
    ],
    featured: true,
    imageCount: 6,
    reviews: [
      {
        guestName: "Ritika M.",
        rating: 5,
        title: "Better than the photos",
        comment:
          "The pool, the plants, the quiet — everything about Villa Zephyr felt considered. The Everloft host had breakfast ready every morning without us asking twice.",
        stayMonth: "March 2026",
      },
      {
        guestName: "Daniel K.",
        rating: 5,
        title: "Impeccably managed",
        comment:
          "This is the first villa rental where nothing felt like a workaround. Fast WiFi, spotless linen, and a host who anticipated everything we needed.",
        stayMonth: "January 2026",
      },
      {
        guestName: "Aisha R.",
        rating: 4,
        title: "Quiet, private, restorative",
        comment: "Exactly the reset we needed after a hard year. Would book again for our anniversary.",
        stayMonth: "December 2025",
      },
    ],
  },
  {
    slug: "aravalli-lake-retreat-udaipur",
    name: "The Aravalli Lake Retreat",
    type: "Luxury Home",
    tagline: "Lake-facing grandeur in the City of Lakes",
    description:
      "Overlooking Fateh Sagar Lake, this five-bedroom residence pairs Rajasthani stone architecture with hotel-grade comfort. Domed ceilings, a private courtyard, and a rooftop lounge frame the Aravalli hills at sunset. Everloft manages every detail, including in-house dining curated around Mewari cuisine.",
    city: "Udaipur",
    area: "Fateh Sagar, Udaipur",
    address: "Fateh Sagar Road, Udaipur, Rajasthan 313001",
    guests: 10,
    bedrooms: 5,
    bathrooms: 5,
    areaSqft: 6000,
    pricePerNight: 58000,
    cleaningFee: 4200,
    rating: 4.92,
    reviewCount: 96,
    amenities: [
      "Rooftop infinity pool",
      "Lake-facing terrace",
      "In-house dining team",
      "High-speed WiFi",
      "Daily housekeeping",
      "Airport transfer on request",
      "Smart TV & OTT apps",
      "Full air conditioning",
      "Power backup",
      "Dedicated parking",
    ],
    highlights: [
      "Uninterrupted Fateh Sagar Lake views",
      "Private rooftop lounge for sundowners",
      "In-house Mewari tasting menus",
      "10-minute drive to City Palace",
    ],
    houseRules: [
      "Check-in from 2:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "Events require prior approval",
      "Quiet hours after 10:30 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Fateh Sagar Lake", distance: "0.1 km" },
      { name: "City Palace Udaipur", distance: "4.5 km" },
      { name: "Maharana Pratap Airport", distance: "24 km" },
    ],
    featured: true,
    imageCount: 6,
    reviews: [
      {
        guestName: "Simone D.",
        rating: 5,
        title: "A postcard come to life",
        comment: "Waking up to the lake every morning was worth the trip alone. The staff felt like an extension of the family.",
        stayMonth: "February 2026",
      },
      {
        guestName: "Arjun V.",
        rating: 5,
        title: "Ran our wedding weekend from here",
        comment: "Everloft coordinated caterers, decorators, and last-minute changes without a single hiccup.",
        stayMonth: "November 2025",
      },
    ],
  },
  {
    slug: "sea-glass-penthouse-alibaug",
    name: "Sea Glass Penthouse",
    type: "Penthouse",
    tagline: "Floor-to-ceiling ocean views above Alibaug",
    description:
      "A top-floor penthouse with wraparound glass walls facing the Arabian Sea. Minimalist interiors in warm oak and brushed brass let the coastline take centre stage, while a private plunge pool and open kitchen make it equally suited to quiet weekends or small celebrations.",
    city: "Alibaug",
    area: "Nagaon Beach, Alibaug",
    address: "Nagaon Beach Road, Alibaug, Maharashtra 402201",
    guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2800,
    pricePerNight: 35000,
    cleaningFee: 3000,
    rating: 4.9,
    reviewCount: 74,
    amenities: [
      "Private plunge pool",
      "Sea-facing balcony",
      "High-speed WiFi",
      "Daily housekeeping",
      "Fully equipped kitchen",
      "Smart TV & OTT apps",
      "Full air conditioning",
      "Elevator access",
      "Power backup",
      "Reserved parking",
    ],
    highlights: [
      "Unobstructed Arabian Sea views",
      "2-minute walk to Nagaon Beach",
      "Private plunge pool on terrace",
      "Sunset-facing living room",
    ],
    houseRules: [
      "Check-in from 3:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "Maximum 6 guests, no exceptions",
      "Quiet hours after 11:00 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Nagaon Beach", distance: "0.2 km" },
      { name: "Alibaug Ferry Jetty", distance: "9 km" },
      { name: "Mumbai (via ferry + road)", distance: "95 km" },
    ],
    featured: true,
    imageCount: 5,
    reviews: [
      {
        guestName: "Karan S.",
        rating: 5,
        title: "Views alone are worth it",
        comment: "Every room looks at the sea. Booking and check-in with Everloft was seamless end to end.",
        stayMonth: "April 2026",
      },
      {
        guestName: "Neha P.",
        rating: 4,
        title: "Perfect couple's weekend",
        comment: "Quiet, clean, and the plunge pool at sunset is unbeatable.",
        stayMonth: "October 2025",
      },
    ],
  },
  {
    slug: "misty-ridge-boutique-coorg",
    name: "Misty Ridge Boutique Stay",
    type: "Boutique Stay",
    tagline: "Coffee estate charm above the clouds",
    description:
      "Tucked inside a working coffee estate, Misty Ridge offers just two beautifully appointed rooms wrapped in mist and birdsong. Reclaimed wood, hand-woven textiles, and a wraparound veranda make this an intimate escape for guests who want boutique character without giving up hotel-grade service.",
    city: "Coorg",
    area: "Madikeri, Coorg",
    address: "Estate Road, Madikeri, Kodagu, Karnataka 571201",
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1800,
    pricePerNight: 18500,
    cleaningFee: 1800,
    rating: 4.94,
    reviewCount: 61,
    amenities: [
      "Estate-view veranda",
      "Bonfire deck",
      "High-speed WiFi",
      "Daily housekeeping",
      "In-house Coorgi meals",
      "Guided estate walks",
      "Full air conditioning",
      "Power backup",
      "Dedicated parking",
      "Pet friendly",
    ],
    highlights: [
      "Set inside a working coffee estate",
      "Guided plantation & waterfall walks",
      "Home-style Coorgi breakfast included",
      "Evening bonfire with estate views",
    ],
    houseRules: [
      "Check-in from 1:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "Pets allowed with prior notice",
      "Quiet hours after 10:00 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Abbey Falls", distance: "5 km" },
      { name: "Madikeri Town", distance: "7 km" },
      { name: "Mangalore Airport", distance: "132 km" },
    ],
    featured: false,
    imageCount: 5,
    reviews: [
      {
        guestName: "Fiona L.",
        rating: 5,
        title: "Felt like visiting family",
        comment: "The estate walk with the caretaker was a highlight. Small, personal, and beautifully kept.",
        stayMonth: "December 2025",
      },
    ],
  },
  {
    slug: "nilaya-residences-bandra",
    name: "Nilaya Residences",
    type: "Apartment",
    tagline: "Designer calm in the heart of Bandra",
    description:
      "A sleek two-bedroom apartment in Bandra West, styled with warm minimalism and outfitted for both business travel and city breaks. Floor-to-ceiling windows, a curated art wall, and a compact home office make Nilaya a favourite for extended stays.",
    city: "Mumbai",
    area: "Bandra West, Mumbai",
    address: "Carter Road, Bandra West, Mumbai, Maharashtra 400050",
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1400,
    pricePerNight: 22000,
    cleaningFee: 2200,
    rating: 4.88,
    reviewCount: 143,
    amenities: [
      "High-speed WiFi",
      "Dedicated workspace",
      "Daily housekeeping",
      "Fully equipped kitchen",
      "Smart TV & OTT apps",
      "Full air conditioning",
      "Building gym access",
      "Elevator access",
      "Power backup",
      "Reserved parking",
    ],
    highlights: [
      "Steps from Carter Road promenade",
      "Dedicated home-office nook",
      "Curated local art & design pieces",
      "24×7 building security",
    ],
    houseRules: [
      "Check-in from 2:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "No parties or events",
      "Quiet hours after 10:30 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Carter Road Promenade", distance: "0.3 km" },
      { name: "Bandra Station", distance: "2.1 km" },
      { name: "Chhatrapati Shivaji Airport", distance: "12 km" },
    ],
    featured: false,
    imageCount: 5,
    reviews: [
      {
        guestName: "Meera J.",
        rating: 5,
        title: "My go-to for Mumbai trips",
        comment: "Third stay here. Consistent quality every time, and the workspace is genuinely usable.",
        stayMonth: "May 2026",
      },
    ],
  },
  {
    slug: "the-jaipur-haveli",
    name: "The Jaipur Haveli",
    type: "Holiday Home",
    tagline: "A restored heritage haveli in the Pink City",
    description:
      "This 19th-century haveli has been meticulously restored with hand-painted frescoes, a central courtyard, and modern suites tucked behind original stone facades. Ideal for large family gatherings and celebrations, with a resident chef trained in royal Rajasthani cuisine.",
    city: "Jaipur",
    area: "Walled City, Jaipur",
    address: "Near Tripolia Bazaar, Walled City, Jaipur, Rajasthan 302002",
    guests: 12,
    bedrooms: 6,
    bathrooms: 6,
    areaSqft: 7200,
    pricePerNight: 65000,
    cleaningFee: 5000,
    rating: 4.91,
    reviewCount: 58,
    amenities: [
      "Central courtyard",
      "Resident chef",
      "High-speed WiFi",
      "Daily housekeeping",
      "Event & celebration hosting",
      "Smart TV & OTT apps",
      "Full air conditioning",
      "Power backup",
      "Dedicated parking",
      "Heritage walk on request",
    ],
    highlights: [
      "Hand-painted 19th-century frescoes",
      "Resident chef for royal Rajasthani cuisine",
      "5-minute walk to Tripolia Bazaar",
      "Courtyard suited for celebrations",
    ],
    houseRules: [
      "Check-in from 1:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "Events require prior approval",
      "Quiet hours after 11:00 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Tripolia Bazaar", distance: "0.4 km" },
      { name: "City Palace Jaipur", distance: "1.2 km" },
      { name: "Jaipur International Airport", distance: "16 km" },
    ],
    featured: true,
    imageCount: 6,
    reviews: [
      {
        guestName: "The Malhotra Family",
        rating: 5,
        title: "Our family reunion, elevated",
        comment: "22 of us stayed across two havelis Everloft manages nearby. Coordination between properties was flawless.",
        stayMonth: "February 2026",
      },
    ],
  },
  {
    slug: "pinewood-chalet-nainital",
    name: "Pinewood Chalet",
    type: "Holiday Home",
    tagline: "A timber chalet above Naini Lake",
    description:
      "Wrapped in deodar pines with views over Naini Lake, this timber-framed chalet brings mountain-lodge warmth to the Kumaon hills. A wood-burning fireplace, wraparound deck, and floor-to-ceiling windows make it ideal for quiet winters and monsoon retreats alike.",
    city: "Nainital",
    area: "Ayarpatta, Nainital",
    address: "Ayarpatta Slope, Nainital, Uttarakhand 263002",
    guests: 6,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2400,
    pricePerNight: 24500,
    cleaningFee: 2400,
    rating: 4.93,
    reviewCount: 47,
    amenities: [
      "Wood-burning fireplace",
      "Lake-facing deck",
      "High-speed WiFi",
      "Daily housekeeping",
      "In-house Kumaoni meals on request",
      "Smart TV & OTT apps",
      "Room heaters",
      "Power backup",
      "Dedicated parking",
      "Pet friendly",
    ],
    highlights: [
      "Panoramic Naini Lake views",
      "Wood-burning fireplace lounge",
      "15-minute walk to Mall Road",
      "Birdwatching deck at sunrise",
    ],
    houseRules: [
      "Check-in from 1:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "Pets allowed with prior notice",
      "Quiet hours after 10:00 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Naini Lake", distance: "0.8 km" },
      { name: "Mall Road", distance: "1.5 km" },
      { name: "Pantnagar Airport", distance: "68 km" },
    ],
    featured: false,
    imageCount: 5,
    reviews: [
      {
        guestName: "Rahul B.",
        rating: 5,
        title: "Fireplace views, hotel service",
        comment: "It rained the whole weekend and we didn't mind at all. The fireplace and the lake view did all the work.",
        stayMonth: "July 2025",
      },
    ],
  },
  {
    slug: "gokarna-cliffside-villa",
    name: "Gokarna Cliffside Villa",
    type: "Villa",
    tagline: "Perched above Om Beach's turquoise coastline",
    description:
      "A four-bedroom villa carved into the cliffs above Om Beach, with an infinity-edge pool that appears to spill into the Arabian Sea. Laterite stone, teak furniture, and an open-air dining pavilion capture Gokarna's barefoot-luxury spirit.",
    city: "Gokarna",
    area: "Om Beach, Gokarna",
    address: "Om Beach Road, Gokarna, Karnataka 581326",
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3800,
    pricePerNight: 39000,
    cleaningFee: 3200,
    rating: 4.95,
    reviewCount: 82,
    amenities: [
      "Cliffside infinity pool",
      "Sea-facing dining pavilion",
      "High-speed WiFi",
      "Daily housekeeping",
      "Personal chef on request",
      "Smart TV & OTT apps",
      "Full air conditioning",
      "Power backup",
      "Dedicated parking",
      "Yoga deck",
    ],
    highlights: [
      "Infinity pool overlooking Om Beach",
      "Private cliffside yoga deck",
      "10-minute walk down to the beach",
      "Sunset dining pavilion",
    ],
    houseRules: [
      "Check-in from 2:00 PM, check-out by 11:00 AM",
      "No smoking indoors",
      "No parties or events",
      "Quiet hours after 11:00 PM",
      "Government ID required for all guests at check-in",
    ],
    nearbyPlaces: [
      { name: "Om Beach", distance: "0.9 km" },
      { name: "Gokarna Town", distance: "6 km" },
      { name: "Goa International Airport", distance: "145 km" },
    ],
    featured: true,
    imageCount: 6,
    reviews: [
      {
        guestName: "Elena T.",
        rating: 5,
        title: "The infinity pool is not an exaggeration",
        comment: "It genuinely looks like it drops into the ocean. One of the best stays we've booked anywhere.",
        stayMonth: "January 2026",
      },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.review.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();

  for (const p of properties) {
    const created = await prisma.property.create({
      data: {
        slug: p.slug,
        name: p.name,
        type: p.type,
        tagline: p.tagline,
        description: p.description,
        city: p.city,
        area: p.area,
        address: p.address,
        guests: p.guests,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqft: p.areaSqft,
        pricePerNight: p.pricePerNight,
        cleaningFee: p.cleaningFee,
        serviceFeePct: 0.08,
        rating: p.rating,
        reviewCount: p.reviewCount,
        heroImage: p.slug,
        amenities: JSON.stringify(p.amenities),
        highlights: JSON.stringify(p.highlights),
        houseRules: JSON.stringify(p.houseRules),
        nearbyPlaces: JSON.stringify(p.nearbyPlaces),
        featured: p.featured,
        images: {
          create: Array.from({ length: p.imageCount }).map((_, i) => ({
            url: `${p.slug}-${i + 1}`,
            alt: `${p.name} — view ${i + 1}`,
            sortOrder: i,
          })),
        },
        reviews: {
          create: p.reviews.map((r) => ({
            guestName: r.guestName,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            stayMonth: r.stayMonth,
          })),
        },
      },
    });
    console.log(`  created ${created.name}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
