import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "50");

  const shops = await db.shop.findMany({
    where: { isActive: true },
  });

  // Calculate distance and filter
  const shopsWithDistance = shops
    .map((shop) => ({
      ...shop,
      distance: haversineDistance(lat, lng, shop.latitude, shop.longitude),
    }))
    .filter((shop) => shop.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ shops: shopsWithDistance });
}
