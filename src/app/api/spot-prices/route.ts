import { NextResponse } from "next/server";
import { getSpotPrices } from "@/lib/pricing/spot-prices";

export async function GET() {
  const prices = await getSpotPrices();
  return NextResponse.json(prices);
}
