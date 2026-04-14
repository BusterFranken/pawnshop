import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const weekdayHours = { open: "09:00", close: "18:00" };
const saturdayHours = { open: "10:00", close: "16:00" };
const closed = null;

function makeHours(
  weekday = weekdayHours,
  sat = saturdayHours,
  sun: { open: string; close: string } | null = closed
) {
  return {
    mon: weekday,
    tue: weekday,
    wed: weekday,
    thu: weekday,
    fri: weekday,
    sat,
    sun,
  };
}

const shops = [
  // --- New York City ---
  {
    name: "Gold Exchange NYC",
    slug: "gold-exchange-nyc",
    address: "47 W 47th St",
    city: "New York",
    state: "NY",
    zipCode: "10036",
    latitude: 40.7578,
    longitude: -73.9787,
    phone: "(212) 555-0101",
    description:
      "Premier gold and silver buyer in the heart of Manhattan's Diamond District. Walk-ins welcome.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.62,
    rating: 4.7,
    hours: makeHours(),
    isActive: true,
  },
  {
    name: "Empire Pawn & Jewelry",
    slug: "empire-pawn-jewelry",
    address: "820 8th Ave",
    city: "New York",
    state: "NY",
    zipCode: "10019",
    latitude: 40.7614,
    longitude: -73.9847,
    phone: "(212) 555-0102",
    description:
      "Family-owned since 1987. Specializing in fine jewelry, gold coins, and estate pieces.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.60,
    rating: 4.5,
    hours: makeHours(),
    isActive: true,
  },
  {
    name: "Brooklyn Precious Metals",
    slug: "brooklyn-precious-metals",
    address: "412 Atlantic Ave",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11217",
    latitude: 40.6849,
    longitude: -73.9794,
    phone: "(718) 555-0103",
    description:
      "Brooklyn's trusted precious metals dealer. Competitive rates on gold, silver, and platinum.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.58,
    rating: 4.3,
    hours: makeHours(),
    isActive: true,
  },

  // --- Los Angeles ---
  {
    name: "Beverly Hills Gold Buyers",
    slug: "beverly-hills-gold-buyers",
    address: "9380 Wilshire Blvd",
    city: "Beverly Hills",
    state: "CA",
    zipCode: "90212",
    latitude: 34.0696,
    longitude: -118.3972,
    phone: "(310) 555-0201",
    description:
      "Upscale gold buying experience on Wilshire Boulevard. GIA-certified appraisers on staff.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.65,
    rating: 4.9,
    hours: makeHours({ open: "10:00", close: "19:00" }),
    isActive: true,
  },
  {
    name: "LA Gold & Silver Exchange",
    slug: "la-gold-silver-exchange",
    address: "607 S Hill St",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90014",
    latitude: 34.0452,
    longitude: -118.2551,
    phone: "(213) 555-0202",
    description:
      "Located in the Jewelry District downtown. Instant cash offers on all precious metals.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.59,
    rating: 4.2,
    hours: makeHours({ open: "09:30", close: "17:30" }),
    isActive: true,
  },

  // --- Chicago ---
  {
    name: "Windy City Pawn",
    slug: "windy-city-pawn",
    address: "35 N Wabash Ave",
    city: "Chicago",
    state: "IL",
    zipCode: "60602",
    latitude: 41.8818,
    longitude: -87.6264,
    phone: "(312) 555-0301",
    description:
      "Chicago's most trusted pawn shop since 1972. Fair prices on gold, silver, and jewelry.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.57,
    rating: 4.4,
    hours: makeHours(),
    isActive: true,
  },
  {
    name: "Magnificent Mile Gold",
    slug: "magnificent-mile-gold",
    address: "645 N Michigan Ave",
    city: "Chicago",
    state: "IL",
    zipCode: "60611",
    latitude: 41.8932,
    longitude: -87.6244,
    phone: "(312) 555-0302",
    description:
      "Premium gold buying on the Magnificent Mile. Discreet, professional service.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.63,
    rating: 4.6,
    hours: makeHours({ open: "10:00", close: "19:00" }),
    isActive: true,
  },

  // --- Miami ---
  {
    name: "South Beach Gold & Pawn",
    slug: "south-beach-gold-pawn",
    address: "1250 Collins Ave",
    city: "Miami Beach",
    state: "FL",
    zipCode: "33139",
    latitude: 25.7854,
    longitude: -80.1309,
    phone: "(305) 555-0401",
    description:
      "Miami Beach's favorite pawn shop. We buy gold, silver, watches, and designer jewelry.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.55,
    rating: 4.1,
    hours: makeHours(
      { open: "10:00", close: "20:00" },
      { open: "10:00", close: "18:00" },
      { open: "12:00", close: "17:00" }
    ),
    isActive: true,
  },
  {
    name: "Coral Gables Precious Metals",
    slug: "coral-gables-precious-metals",
    address: "260 Miracle Mile",
    city: "Coral Gables",
    state: "FL",
    zipCode: "33134",
    latitude: 25.7498,
    longitude: -80.2589,
    phone: "(305) 555-0402",
    description:
      "Refined precious metals buying on Miracle Mile. By appointment or walk-in.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.61,
    rating: 4.8,
    hours: makeHours(),
    isActive: true,
  },

  // --- Houston ---
  {
    name: "Houston Gold Depot",
    slug: "houston-gold-depot",
    address: "2323 S Shepherd Dr",
    city: "Houston",
    state: "TX",
    zipCode: "77019",
    latitude: 29.7438,
    longitude: -95.4103,
    phone: "(713) 555-0501",
    description:
      "Houston's top-rated gold buyer. Free appraisals with no obligation to sell.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.56,
    rating: 4.3,
    hours: makeHours(),
    isActive: true,
  },
  {
    name: "Lone Star Pawn & Gold",
    slug: "lone-star-pawn-gold",
    address: "5015 Westheimer Rd",
    city: "Houston",
    state: "TX",
    zipCode: "77056",
    latitude: 29.7406,
    longitude: -95.4612,
    phone: "(713) 555-0502",
    description:
      "Serving the Galleria area with honest appraisals and same-day payouts.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.54,
    rating: 3.9,
    hours: makeHours(
      { open: "08:30", close: "18:00" },
      { open: "09:00", close: "15:00" }
    ),
    isActive: true,
  },

  // --- Phoenix ---
  {
    name: "Desert Gold Buyers",
    slug: "desert-gold-buyers",
    address: "3110 N Central Ave",
    city: "Phoenix",
    state: "AZ",
    zipCode: "85012",
    latitude: 33.4763,
    longitude: -112.0738,
    phone: "(602) 555-0601",
    description:
      "Phoenix's premier gold and silver exchange. Serving the Valley since 1995.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.55,
    rating: 4.0,
    hours: makeHours({ open: "08:00", close: "17:00" }),
    isActive: true,
  },

  // --- Philadelphia ---
  {
    name: "Liberty Bell Pawn",
    slug: "liberty-bell-pawn",
    address: "710 Sansom St",
    city: "Philadelphia",
    state: "PA",
    zipCode: "19106",
    latitude: 39.9487,
    longitude: -75.1541,
    phone: "(215) 555-0701",
    description:
      "Historic Philadelphia's go-to pawn shop. Jewelers Row location with expert appraisers.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.58,
    rating: 4.4,
    hours: makeHours(),
    isActive: true,
  },

  // --- San Antonio ---
  {
    name: "Alamo City Gold",
    slug: "alamo-city-gold",
    address: "118 Broadway St",
    city: "San Antonio",
    state: "TX",
    zipCode: "78205",
    latitude: 29.4252,
    longitude: -98.4891,
    phone: "(210) 555-0801",
    description:
      "Downtown San Antonio gold buyer near the River Walk. Bilingual staff available.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.53,
    rating: 4.1,
    hours: makeHours(
      weekdayHours,
      { open: "10:00", close: "15:00" }
    ),
    isActive: true,
  },

  // --- San Diego ---
  {
    name: "Pacific Gold Exchange",
    slug: "pacific-gold-exchange",
    address: "875 Garnet Ave",
    city: "San Diego",
    state: "CA",
    zipCode: "92109",
    latitude: 32.7961,
    longitude: -117.2482,
    phone: "(619) 555-0901",
    description:
      "Pacific Beach's trusted gold and silver dealer. Laid-back vibe, serious offers.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.57,
    rating: 4.5,
    hours: makeHours(
      { open: "10:00", close: "18:00" },
      { open: "10:00", close: "16:00" },
      { open: "11:00", close: "15:00" }
    ),
    isActive: true,
  },

  // --- Dallas ---
  {
    name: "Big D Gold & Silver",
    slug: "big-d-gold-silver",
    address: "2817 Greenville Ave",
    city: "Dallas",
    state: "TX",
    zipCode: "75206",
    latitude: 32.8148,
    longitude: -96.7694,
    phone: "(214) 555-1001",
    description:
      "Lower Greenville's neighborhood gold buyer. Transparent pricing with real-time spot rates.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.56,
    rating: 4.2,
    hours: makeHours(),
    isActive: true,
  },
  {
    name: "DFW Precious Metals",
    slug: "dfw-precious-metals",
    address: "13350 Dallas Pkwy",
    city: "Dallas",
    state: "TX",
    zipCode: "75240",
    latitude: 32.9346,
    longitude: -96.8209,
    phone: "(972) 555-1002",
    description:
      "North Dallas location with private appraisal rooms. Gold, silver, platinum, and palladium.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.64,
    rating: 4.7,
    hours: makeHours({ open: "09:00", close: "17:00" }),
    isActive: true,
  },

  // --- Denver ---
  {
    name: "Mile High Gold",
    slug: "mile-high-gold",
    address: "1536 Larimer St",
    city: "Denver",
    state: "CO",
    zipCode: "80202",
    latitude: 39.7478,
    longitude: -104.9995,
    phone: "(303) 555-1101",
    description:
      "Larimer Square's gold buying specialist. We also buy silver bullion and coins.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.57,
    rating: 4.3,
    hours: makeHours(),
    isActive: true,
  },

  // --- Seattle ---
  {
    name: "Emerald City Pawn",
    slug: "emerald-city-pawn",
    address: "1421 1st Ave",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    latitude: 47.6091,
    longitude: -122.3402,
    phone: "(206) 555-1201",
    description:
      "Downtown Seattle pawn shop near Pike Place Market. Buying gold and silver daily.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.56,
    rating: 4.0,
    hours: makeHours(
      { open: "09:00", close: "18:00" },
      { open: "10:00", close: "17:00" }
    ),
    isActive: true,
  },

  // --- Atlanta ---
  {
    name: "Peachtree Gold & Jewelry",
    slug: "peachtree-gold-jewelry",
    address: "3167 Peachtree Rd NE",
    city: "Atlanta",
    state: "GA",
    zipCode: "30305",
    latitude: 33.8402,
    longitude: -84.3798,
    phone: "(404) 555-1301",
    description:
      "Buckhead's upscale gold and jewelry buyer. Estate jewelry and luxury watches welcome.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.62,
    rating: 4.6,
    hours: makeHours({ open: "10:00", close: "18:00" }),
    isActive: true,
  },

  // --- Boston ---
  {
    name: "Beacon Hill Gold",
    slug: "beacon-hill-gold",
    address: "44 Charles St",
    city: "Boston",
    state: "MA",
    zipCode: "02114",
    latitude: 42.3582,
    longitude: -71.0700,
    phone: "(617) 555-1401",
    description:
      "Established Beacon Hill shop specializing in antique gold, estate silver, and heirloom pieces.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.60,
    rating: 4.5,
    hours: makeHours(
      { open: "10:00", close: "17:00" },
      { open: "10:00", close: "15:00" }
    ),
    isActive: true,
  },

  // --- Las Vegas ---
  {
    name: "Vegas Strip Gold Buyers",
    slug: "vegas-strip-gold-buyers",
    address: "3200 S Las Vegas Blvd",
    city: "Las Vegas",
    state: "NV",
    zipCode: "89109",
    latitude: 36.1266,
    longitude: -115.1700,
    phone: "(702) 555-1501",
    description:
      "Open late on the Strip. Walk in any time to sell your gold, silver, or jewelry.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.52,
    rating: 3.8,
    hours: makeHours(
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" }
    ),
    isActive: true,
  },

  // --- San Francisco ---
  {
    name: "Golden Gate Precious Metals",
    slug: "golden-gate-precious-metals",
    address: "865 Market St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103",
    latitude: 37.7836,
    longitude: -122.4078,
    phone: "(415) 555-1601",
    description:
      "Union Square area precious metals buyer. Certified appraisals and instant payment.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: true,
    payoutFactor: 0.61,
    rating: 4.4,
    hours: makeHours(),
    isActive: true,
  },

  // --- Nashville ---
  {
    name: "Music City Gold",
    slug: "music-city-gold",
    address: "508 Church St",
    city: "Nashville",
    state: "TN",
    zipCode: "37219",
    latitude: 36.1627,
    longitude: -86.7791,
    phone: "(615) 555-1701",
    description:
      "Downtown Nashville gold buyer. Friendly, fast service with competitive payouts.",
    acceptsGold: true,
    acceptsSilver: true,
    acceptsPlatinum: false,
    payoutFactor: 0.54,
    rating: 3.5,
    hours: makeHours(
      weekdayHours,
      { open: "10:00", close: "14:00" }
    ),
    isActive: true,
  },
];

async function main() {
  console.log("Seeding pawn shops...");

  for (const shop of shops) {
    const result = await prisma.shop.upsert({
      where: { slug: shop.slug },
      update: {
        name: shop.name,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        zipCode: shop.zipCode,
        latitude: shop.latitude,
        longitude: shop.longitude,
        phone: shop.phone,
        description: shop.description,
        acceptsGold: shop.acceptsGold,
        acceptsSilver: shop.acceptsSilver,
        acceptsPlatinum: shop.acceptsPlatinum,
        payoutFactor: shop.payoutFactor,
        rating: shop.rating,
        hours: shop.hours,
        isActive: shop.isActive,
      },
      create: shop,
    });
    console.log(`  Upserted: ${result.name} (${result.city}, ${result.state})`);
  }

  console.log(`\nSeeded ${shops.length} pawn shops.`);

  // --- Seed admin and shop owner users ---
  console.log("\nSeeding admin and shop owner users...");

  const adminPassword = hashSync("admin123", 10);
  const ownerPassword = hashSync("owner123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pawnshop.com" },
    update: { password: adminPassword, role: "ADMIN" },
    create: {
      email: "admin@pawnshop.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
      isAnonymous: false,
    },
  });
  console.log(`  Admin: ${admin.email}`);

  // Create shop owners and link to shops
  const shopOwners = [
    { email: "owner@goldexchangenyc.com", name: "John Gold", shopSlug: "gold-exchange-nyc" },
    { email: "owner@beverlyhillsgold.com", name: "Sarah Beverly", shopSlug: "beverly-hills-gold-buyers" },
    { email: "owner@windycitypawn.com", name: "Mike Chicago", shopSlug: "windy-city-pawn" },
  ];

  for (const ownerData of shopOwners) {
    const owner = await prisma.user.upsert({
      where: { email: ownerData.email },
      update: { password: ownerPassword, role: "SHOP_OWNER" },
      create: {
        email: ownerData.email,
        name: ownerData.name,
        password: ownerPassword,
        role: "SHOP_OWNER",
        isAnonymous: false,
      },
    });

    await prisma.shop.update({
      where: { slug: ownerData.shopSlug },
      data: { ownerId: owner.id },
    });

    console.log(`  Shop owner: ${owner.email} -> ${ownerData.shopSlug}`);
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
